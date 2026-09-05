import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Note, NoteAttachment, SmartShape } from '../types';
import { sound } from '../utils/audio';
import {
  Folder,
  FolderPlus,
  Pin,
  Lock,
  Unlock,
  Plus,
  Search,
  Tag,
  Paperclip,
  Mic,
  MicOff,
  Camera,
  PenTool,
  Table,
  Link as LinkIcon,
  Trash2,
  FileText,
  CheckSquare,
  Square,
  Shield,
  Fingerprint,
  Smile,
  ChevronRight,
  Sparkles,
  MapPin,
  ExternalLink,
  Volume2,
  Download,
  X,
  Heading1,
  Heading2,
  Bold,
  Italic,
  List,
  ListOrdered,
  BookOpen,
  GraduationCap,
  Bookmark,
  Heart,
  Star,
  Briefcase,
  Award,
  Palette,
  Users,
  Edit2,
  Settings,
} from 'lucide-react';

export const FOLDER_ICON_OPTIONS = [
  { id: 'Folder', label: 'Folder' },
  { id: 'BookOpen', label: 'Lesson / Book' },
  { id: 'GraduationCap', label: 'Class / School' },
  { id: 'FileText', label: 'Documents' },
  { id: 'Bookmark', label: 'Bookmark' },
  { id: 'Sparkles', label: 'Ideas / Inspiration' },
  { id: 'Heart', label: 'Personal / Well-being' },
  { id: 'Star', label: 'Starred / Priority' },
  { id: 'Briefcase', label: 'Admin / Work' },
  { id: 'Shield', label: 'Confidential / IEP' },
  { id: 'Award', label: 'Grades / Honors' },
  { id: 'Palette', label: 'Creative / Arts' },
  { id: 'Users', label: 'Department / Team' },
];

export const FOLDER_COLOR_PRESETS = [
  { label: 'Emerald', hex: '#059669' },
  { label: 'Indigo', hex: '#4F46E5' },
  { label: 'Purple', hex: '#7C3AED' },
  { label: 'Pink', hex: '#EC4899' },
  { label: 'Rose', hex: '#E11D48' },
  { label: 'Amber', hex: '#D97706' },
  { label: 'Sky', hex: '#0284C7' },
  { label: 'Teal', hex: '#0D9488' },
  { label: 'Slate', hex: '#475569' },
];

export const renderFolderIcon = (iconName?: string, className: string = 'w-3.5 h-3.5') => {
  switch (iconName) {
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Bookmark':
      return <Bookmark className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Star':
      return <Star className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Folder':
    default:
      return <Folder className={className} />;
  }
};

export const NotesView: React.FC = () => {
  const { notes, folders, addNote, updateNote, deleteNote, addFolder, updateFolder, deleteFolder } = useApp();

  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');

  // Security Lock
  const [unlockedNotes, setUnlockedNotes] = useState<Record<string, boolean>>({});
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Audio Recording modal/state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecordSeconds, setAudioRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Document Camera Scanner modal/state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Drawing Canvas modal/state
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushColor, setBrushColor] = useState('#4F46E5');
  const [brushSize, setBrushSize] = useState(3);
  const [isSmartShapesEnabled, setIsSmartShapesEnabled] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const strokePointsRef = useRef<{ x: number; y: number }[]>([]);

  // Wiki Note Linking Modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // New Folder Modal
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#4F46E5');
  const [newFolderIcon, setNewFolderIcon] = useState('Folder');

  // Folder Management & Edit Modal
  const [isManageFoldersModalOpen, setIsManageFoldersModalOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('#4F46E5');
  const [editFolderIcon, setEditFolderIcon] = useState('Folder');

  // Active note
  const currentNote = notes.find((n) => n.id === selectedNoteId) || notes[0];
  const isCurrentNoteLocked = currentNote?.isLocked && !unlockedNotes[currentNote.id];

  // All distinct tags across notes
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  // Filtered notes list
  const filteredNotes = notes.filter((n) => {
    if (selectedFolderId !== 'all' && n.folderId !== selectedFolderId) return false;
    if (tagFilter !== 'all' && !n.tags.includes(tagFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      const matchTag = n.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTag) return false;
    }
    return true;
  });

  // Sort: pinned first, then by updatedAt
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleCreateNewNote = () => {
    const newNote = addNote({
      title: 'Untitled Lesson Note',
      content: '# New Note\n\nStart writing notes, ideas, or lesson instructions here...',
      folderId: selectedFolderId === 'all' ? (folders[0]?.id || 'f-1') : selectedFolderId,
      isPinned: false,
      isLocked: false,
      tags: ['Classroom'],
      linkedNoteIds: [],
      attachments: [],
    });
    setSelectedNoteId(newNote.id);
  };

  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentNote && currentNote.pinCode === pinInput) {
      setUnlockedNotes((prev) => ({ ...prev, [currentNote.id]: true }));
      setPinInput('');
      setPinError(false);
      sound.playChime('complete');
    } else {
      setPinError(true);
      sound.playChime('buzz');
    }
  };

  const handleSimulateFaceId = () => {
    if (currentNote) {
      setUnlockedNotes((prev) => ({ ...prev, [currentNote.id]: true }));
      setPinError(false);
      sound.playChime('complete');
    }
  };

  // Audio Recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Add attachment with simulated speech transcription
        if (currentNote) {
          const newAtt: NoteAttachment = {
            id: `att-${Date.now()}`,
            type: 'audio',
            name: `Voice_Memo_${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.webm`,
            url: audioUrl,
            size: `${(audioBlob.size / 1024).toFixed(1)} KB`,
            transcription:
              'Transcription: "Teacher discussion summary: Remind Period 3 to submit creative writing portfolios before Thursday 3pm."',
            timestamp: 'Just now',
          };
          updateNote(currentNote.id, {
            attachments: [...(currentNote.attachments || []), newAtt],
          });
          sound.playChime('bell');
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecordingAudio(true);
      setAudioRecordSeconds(0);
    } catch (err) {
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  useEffect(() => {
    let timer: number;
    if (isRecordingAudio) {
      timer = window.setInterval(() => {
        setAudioRecordSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingAudio]);

  // Document Camera Scanner
  const startScanner = async () => {
    setIsScannerOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      // Camera fallback if not permitted
    }
  };

  const stopScanner = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsScannerOpen(false);
  };

  const captureScannedDocument = () => {
    if (!videoRef.current || !currentNote) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // High contrast document filter
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const adjusted = v > 120 ? 255 : v < 70 ? 0 : v;
        d[i] = adjusted;
        d[i + 1] = adjusted;
        d[i + 2] = adjusted;
      }
      ctx.putImageData(imgData, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const newAtt: NoteAttachment = {
        id: `scan-${Date.now()}`,
        type: 'scanned_doc',
        name: `Scanned_Doc_${new Date().toLocaleDateString()}.pdf`,
        url: dataUrl,
        size: '1.4 MB (Scanned PDF)',
        timestamp: 'Just now',
      };

      updateNote(currentNote.id, {
        attachments: [...(currentNote.attachments || []), newAtt],
      });
      sound.playChime('complete');
    }
    stopScanner();
  };

  // Drawing Canvas with Smart Shapes
  const openDrawingCanvas = () => {
    setIsCanvasOpen(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.parentElement?.clientWidth || 700;
        canvas.height = 420;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 100);
  };

  const startDrawingStroke = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    strokePointsRef.current = [{ x, y }];

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const drawStroke = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    strokePointsRef.current.push({ x, y });

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const endDrawingStroke = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Smart Shapes detection
    if (isSmartShapesEnabled && strokePointsRef.current.length > 15) {
      const pts = strokePointsRef.current;
      const minX = Math.min(...pts.map((p) => p.x));
      const maxX = Math.max(...pts.map((p) => p.x));
      const minY = Math.min(...pts.map((p) => p.y));
      const maxY = Math.max(...pts.map((p) => p.y));
      const width = maxX - minX;
      const height = maxY - minY;

      const firstPt = pts[0];
      const lastPt = pts[pts.length - 1];
      const distance = Math.hypot(lastPt.x - firstPt.x, lastPt.y - firstPt.y);

      // Check if roughly closed shape (circle or rectangle)
      if (distance < 45 && width > 40 && height > 40) {
        const ratio = width / height;
        if (ratio > 0.8 && ratio < 1.2) {
          // Snap to clean circle!
          ctx.beginPath();
          const cx = minX + width / 2;
          const cy = minY + height / 2;
          const r = (width + height) / 4;
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = brushColor;
          ctx.lineWidth = brushSize + 1;
          ctx.stroke();
          sound.playChime('bell');
        } else {
          // Snap to clean rectangle!
          ctx.beginPath();
          ctx.rect(minX, minY, width, height);
          ctx.strokeStyle = brushColor;
          ctx.lineWidth = brushSize + 1;
          ctx.stroke();
          sound.playChime('bell');
        }
      }
    }
  };

  const saveDrawing = () => {
    if (!canvasRef.current || !currentNote) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const newAtt: NoteAttachment = {
      id: `draw-${Date.now()}`,
      type: 'image',
      name: `Handwritten_Sketch_${Date.now()}.png`,
      url: dataUrl,
      size: 'Canvas Drawing',
      timestamp: 'Just now',
    };
    updateNote(currentNote.id, {
      attachments: [...(currentNote.attachments || []), newAtt],
    });
    setIsCanvasOpen(false);
    sound.playChime('complete');
  };

  // Text formatting insert helpers
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!currentNote) return;
    const newContent = `${currentNote.content}\n${prefix}Text${suffix}`;
    updateNote(currentNote.id, { content: newContent });
  };

  const insertTable = () => {
    if (!currentNote) return;
    updateNote(currentNote.id, {
      tableData: {
        headers: ['Topic', 'Key Vocabulary', 'Action Step', 'Status'],
        rows: [
          ['Discussion Stanza 1', 'Imagery, Rhythm', 'Review line 4', 'Done'],
          ['Discussion Stanza 2', 'Metaphor', 'Student group share', 'Pending'],
        ],
      },
    });
    sound.playChime('bell');
  };

  const updateTableCell = (rowIndex: number, colIndex: number, value: string) => {
    if (!currentNote || !currentNote.tableData) return;
    const updatedRows = currentNote.tableData.rows.map((row, rIdx) =>
      rIdx === rowIndex ? row.map((c, cIdx) => (cIdx === colIndex ? value : c)) : row
    );
    updateNote(currentNote.id, {
      tableData: {
        ...currentNote.tableData,
        rows: updatedRows,
      },
    });
  };

  const addTableRow = () => {
    if (!currentNote || !currentNote.tableData) return;
    const emptyRow = new Array(currentNote.tableData.headers.length).fill('');
    updateNote(currentNote.id, {
      tableData: {
        ...currentNote.tableData,
        rows: [...currentNote.tableData.rows, emptyRow],
      },
    });
  };

  const addTableColumn = () => {
    if (!currentNote || !currentNote.tableData) return;
    const headerName = `Column ${currentNote.tableData.headers.length + 1}`;
    updateNote(currentNote.id, {
      tableData: {
        headers: [...currentNote.tableData.headers, headerName],
        rows: currentNote.tableData.rows.map((r) => [...r, '']),
      },
    });
  };

  const handleLinkNote = (targetNoteId: string) => {
    if (!currentNote) return;
    const target = notes.find((n) => n.id === targetNoteId);
    if (!target) return;

    const linkSyntax = `\n>> [${target.title}]`;
    const updatedLinks = Array.from(new Set([...(currentNote.linkedNoteIds || []), targetNoteId]));
    updateNote(currentNote.id, {
      content: currentNote.content + linkSyntax,
      linkedNoteIds: updatedLinks,
    });
    setIsLinkModalOpen(false);
    sound.playChime('bell');
  };

  const handleAttachMapLocation = () => {
    if (!currentNote) return;
    const loc = prompt('Enter classroom or campus location to pin in note:', 'School Room 204');
    if (loc && loc.trim()) {
      const newAtt: NoteAttachment = {
        id: `loc-${Date.now()}`,
        type: 'link',
        name: `📍 Location: ${loc.trim()}`,
        url: `https://maps.google.com/?q=${encodeURIComponent(loc.trim())}`,
        timestamp: 'Just now',
      };
      updateNote(currentNote.id, {
        attachments: [...(currentNote.attachments || []), newAtt],
      });
      sound.playChime('bell');
    }
  };

  return (
    <div className="flex-1 h-screen flex overflow-hidden">
      {/* Folders & Notes Navigation Panel */}
      <div className="w-80 min-w-80 border-r border-white/50 bg-white/40 backdrop-blur-2xl flex flex-col justify-between shadow-xl shadow-slate-200/20">
        {/* Top Header */}
        <div className="p-4 border-b border-white/40 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Teacher Notes</h2>
            <button
              onClick={handleCreateNewNote}
              id="new-note-btn"
              className="p-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center space-x-1 shadow-md shadow-indigo-200/50 cursor-pointer backdrop-blur-xs"
              title="New Note"
            >
              <Plus className="w-4 h-4" />
              <span>Note</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notes, wikis, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white/90 placeholder-slate-400 shadow-xs"
            />
          </div>

          {/* Folders Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
            <button
              onClick={() => setSelectedFolderId('all')}
              className={`px-2.5 py-1.5 rounded-xl font-bold shrink-0 cursor-pointer transition-all border flex items-center space-x-1.5 ${
                selectedFolderId === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-white/50 backdrop-blur-xs text-slate-600 border-white/50 hover:bg-white/80'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>All ({notes.length})</span>
            </button>
            {folders.map((f) => {
              const isSelected = selectedFolderId === f.id;
              const count = notes.filter((n) => n.folderId === f.id).length;
              const folderColor = f.color || '#4F46E5';

              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold shrink-0 flex items-center space-x-1.5 cursor-pointer transition-all border ${
                    isSelected
                      ? 'text-white shadow-sm'
                      : 'bg-white/50 backdrop-blur-xs text-slate-700 border-white/50 hover:bg-white/80'
                  }`}
                  style={{
                    backgroundColor: isSelected ? folderColor : undefined,
                    borderColor: isSelected ? folderColor : undefined,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      color: isSelected ? '#FFFFFF' : folderColor,
                    }}
                  >
                    {renderFolderIcon(f.icon, 'w-3.5 h-3.5')}
                  </div>
                  <span>{f.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Manage Folders & Add Folder */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => setIsManageFoldersModalOpen(true)}
                className="px-2 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white/50 hover:bg-white/80 border border-white/50 shadow-xs flex items-center space-x-1 cursor-pointer transition-all"
                title="Manage Folders (customize colors & icons)"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[11px] hidden sm:inline">Folders</span>
              </button>

              <button
                onClick={() => {
                  setNewFolderName('');
                  setNewFolderColor('#4F46E5');
                  setNewFolderIcon('Folder');
                  setIsNewFolderModalOpen(true);
                }}
                className="p-1.5 rounded-xl text-slate-600 hover:text-indigo-600 bg-white/50 hover:bg-white/80 border border-white/50 shadow-xs cursor-pointer transition-all"
                title="Create new folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {sortedNotes.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">No notes in this view</div>
          ) : (
            sortedNotes.map((n) => {
              const isSelected = n.id === currentNote?.id;
              const noteFolder = folders.find((f) => f.id === n.folderId);
              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedNoteId(n.id)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-white/80 backdrop-blur-md border-white/90 shadow-md shadow-indigo-100/40'
                      : 'bg-white/40 backdrop-blur-sm border-white/40 hover:border-white/70 hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 truncate">
                      {n.isPinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                      {n.isLocked && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                      <h4
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-indigo-900' : 'text-slate-800'
                        }`}
                      >
                        {n.title || 'Untitled Note'}
                      </h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {n.isLocked && !unlockedNotes[n.id]
                      ? '🔒 Protected Note (Locked with PIN / Touch ID)'
                      : n.content.replace(/[#*`>-]/g, '').slice(0, 75)}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
                      {noteFolder && (
                        <span
                          className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded-md font-semibold text-[9px]"
                          style={{
                            backgroundColor: `${noteFolder.color || '#4F46E5'}18`,
                            color: noteFolder.color || '#4F46E5',
                          }}
                        >
                          {renderFolderIcon(noteFolder.icon, 'w-2.5 h-2.5')}
                          <span className="truncate max-w-[80px]">{noteFolder.name}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {n.attachments?.length > 0 && (
                        <span className="flex items-center space-x-0.5 text-slate-500">
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>{n.attachments.length}</span>
                        </span>
                      )}
                      {n.tags?.map((t) => (
                        <span key={t} className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Tag Filter Bar */}
        {allTags.length > 0 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/70">
            <div className="flex items-center space-x-1 text-[11px] text-slate-500 mb-1 font-semibold">
              <Tag className="w-3 h-3" />
              <span>Smart Tags:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setTagFilter('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${
                  tagFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'
                }`}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTagFilter(t)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer ${
                    tagFilter === t ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Note Editor Panel */}
      <div className="flex-1 flex flex-col bg-white/20 backdrop-blur-xl overflow-y-auto">
        {currentNote ? (
          <>
            {/* Top Toolbar */}
            <div className="p-3 sm:px-6 border-b border-white/40 flex flex-wrap items-center justify-between gap-2 bg-white/50 backdrop-blur-md sticky top-0 z-10 shadow-xs">
              {/* Formatting Controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => insertFormatting('# ')}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormatting('## ')}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormatting('**', '**')}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormatting('*', '*')}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormatting('- ')}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Bulleted List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormatting('1. ')}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertFormatting('- [ ] ')}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Checklist Item"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={insertTable}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Insert Table"
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>

              {/* Media, Drawing & Security Tools */}
              <div className="flex items-center space-x-1.5">
                {/* Audio Recording */}
                {isRecordingAudio ? (
                  <button
                    onClick={stopAudioRecording}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-semibold text-xs animate-pulse cursor-pointer"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Stop ({audioRecordSeconds}s)</span>
                  </button>
                ) : (
                  <button
                    onClick={startAudioRecording}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                    title="Record Audio Memo with transcription"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}

                {/* Camera Scanner */}
                <button
                  onClick={startScanner}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                  title="Document Scanner (Camera)"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Drawing / Stylus Support */}
                <button
                  onClick={openDrawingCanvas}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                  title="Handwriting & Drawing Canvas (Stylus Support + Smart Shapes)"
                >
                  <PenTool className="w-4 h-4" />
                </button>

                {/* Wiki Note Link */}
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                  title="Connect Note (Wiki Link >>)"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                {/* Map Location Tag */}
                <button
                  onClick={handleAttachMapLocation}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer"
                  title="Attach Map Location"
                >
                  <MapPin className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                {/* Pin Toggle */}
                <button
                  onClick={() => updateNote(currentNote.id, { isPinned: !currentNote.isPinned })}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    currentNote.isPinned
                      ? 'text-amber-500 bg-amber-50'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                  title={currentNote.isPinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin className="w-4 h-4" />
                </button>

                {/* Lock Toggle */}
                <button
                  onClick={() => {
                    if (currentNote.isLocked) {
                      updateNote(currentNote.id, { isLocked: false });
                    } else {
                      const code = prompt('Enter a 4-digit passcode for this confidential note:', '1234');
                      if (code) {
                        updateNote(currentNote.id, { isLocked: true, pinCode: code });
                      }
                    }
                  }}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    currentNote.isLocked
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                  title="Password / Touch ID lock"
                >
                  {currentNote.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteNote(currentNote.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note Content View / Lock Screen */}
            {isCurrentNoteLocked ? (
              <div className="flex-1 flex items-center justify-center p-8 bg-transparent">
                <div className="max-w-sm w-full bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/60 shadow-2xl text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50/80 border border-indigo-100/50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Protected Note</h3>

                  <form onSubmit={handleUnlockWithPin} className="space-y-3 pt-2">
                    <input
                      type="password"
                      placeholder="Enter 4-digit PIN (default: 1234)"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full text-center tracking-widest text-lg font-mono py-2 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl focus:outline-none focus:bg-white/90 shadow-xs"
                    />
                    {pinError && <p className="text-xs text-rose-600 font-semibold">Incorrect PIN code</p>}
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer shadow-md shadow-indigo-200/50"
                    >
                      Unlock with PIN
                    </button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/70 backdrop-blur-xs px-2 text-slate-400 rounded-md">or</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSimulateFaceId}
                    className="w-full py-2.5 bg-white/60 hover:bg-white/90 border border-white/60 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Fingerprint className="w-4 h-4 text-indigo-600" />
                    <span>Unlock with Touch ID / Face ID</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 max-w-4xl w-full mx-auto space-y-6">
                {/* Title */}
                <input
                  type="text"
                  value={currentNote.title}
                  onChange={(e) => updateNote(currentNote.id, { title: e.target.value })}
                  placeholder="Note Title..."
                  className="w-full text-2xl sm:text-3xl font-extrabold text-slate-800 focus:outline-none border-b border-transparent hover:border-slate-200 focus:border-indigo-400 pb-2 transition-colors"
                />

                {/* Folder & Tags Bar */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                  {/* Folder Selector Pill */}
                  <div className="flex items-center space-x-1.5 bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-2.5 py-1 shadow-xs">
                    <div
                      className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        color: folders.find((f) => f.id === currentNote.folderId)?.color || '#4F46E5',
                      }}
                    >
                      {renderFolderIcon(
                        folders.find((f) => f.id === currentNote.folderId)?.icon,
                        'w-3.5 h-3.5'
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">Folder:</span>
                    <select
                      value={currentNote.folderId}
                      onChange={(e) => updateNote(currentNote.id, { folderId: e.target.value })}
                      className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer text-xs"
                    >
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags input line */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-400">Tags:</span>
                  {currentNote.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                    >
                      <span>#{t}</span>
                      <button
                        onClick={() =>
                          updateNote(currentNote.id, {
                            tags: currentNote.tags.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      const newT = prompt('Add a new tag:');
                      if (newT && newT.trim()) {
                        updateNote(currentNote.id, {
                          tags: [...currentNote.tags, newT.trim().replace('#', '')],
                        });
                      }
                    }}
                    className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    + Tag
                  </button>
                </div>
              </div>

                {/* Interactive Table if present */}
                {currentNote.tableData && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="bg-slate-100 p-2.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Interactive Classroom Table</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={addTableRow}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-50 cursor-pointer font-medium"
                        >
                          + Row
                        </button>
                        <button
                          onClick={addTableColumn}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-50 cursor-pointer font-medium"
                        >
                          + Column
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            {currentNote.tableData.headers.map((h, i) => (
                              <th key={i} className="p-2.5 text-left font-bold text-slate-700 border-r border-slate-200 last:border-0">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {currentNote.tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-2 border-r border-slate-100 last:border-0">
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) => updateTableCell(rIdx, cIdx, e.target.value)}
                                    className="w-full bg-transparent p-1 focus:bg-white focus:outline-indigo-500 rounded text-slate-700 font-medium"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Note Body Editor */}
                <textarea
                  value={currentNote.content}
                  onChange={(e) => updateNote(currentNote.id, { content: e.target.value })}
                  placeholder="Write note content here... You can type >> to link other notes or format with markdown!"
                  rows={14}
                  className="w-full text-sm sm:text-base text-slate-700 leading-relaxed font-sans bg-transparent resize-y focus:outline-none placeholder-slate-400"
                />

                {/* Attachments Display */}
                {currentNote.attachments && currentNote.attachments.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Media, Recordings & Documents ({currentNote.attachments.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentNote.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-2"
                        >
                          <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                            {att.type === 'audio' ? (
                              <Volume2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                            ) : att.type === 'scanned_doc' ? (
                              <Camera className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            ) : att.type === 'image' ? (
                              <PenTool className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                            ) : (
                              <FileText className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{att.name}</p>
                              {att.size && <p className="text-[10px] text-slate-400">{att.size}</p>}
                              {att.transcription && (
                                <p className="text-[11px] text-slate-600 mt-1 italic line-clamp-2 bg-white p-1.5 rounded border border-slate-200">
                                  {att.transcription}
                                </p>
                              )}
                              {att.url && att.url !== '#' && (
                                <div className="mt-2">
                                  {att.type === 'image' || att.type === 'scanned_doc' ? (
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      className="max-h-36 rounded-lg border border-slate-200 object-cover"
                                    />
                                  ) : att.type === 'audio' ? (
                                    <audio controls src={att.url} className="w-full h-8 mt-1" />
                                  ) : (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
                                    >
                                      <span>Open Link</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              updateNote(currentNote.id, {
                                attachments: (currentNote.attachments || []).filter((a) => a.id !== att.id),
                              })
                            }
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Notes Wiki Section */}
                {currentNote.linkedNoteIds && currentNote.linkedNoteIds.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Connected Wiki Notes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentNote.linkedNoteIds.map((linkedId) => {
                        const linked = notes.find((n) => n.id === linkedId);
                        if (!linked) return null;
                        return (
                          <button
                            key={linkedId}
                            onClick={() => setSelectedNoteId(linkedId)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer shadow-xs"
                          >
                            <ChevronRight className="w-3 h-3 text-indigo-600" />
                            <span>{linked.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select or create a note to begin.
          </div>
        )}
      </div>

      {/* Camera Document Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-xl w-full space-y-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Document Scanner (Edge Auto-Detect)</h3>
              </div>
              <button onClick={stopScanner} className="text-slate-400 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>

            {/* Video Viewfinder */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-dashed border-emerald-400/60">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Document Alignment Grid Overlay */}
              <div className="absolute inset-8 border border-white/40 pointer-events-none flex flex-col justify-between p-2">
                <span className="text-[10px] text-emerald-400 font-mono bg-black/60 px-2 py-0.5 rounded self-start">
                  Align paper edges here
                </span>
                <div className="self-end text-[10px] text-emerald-400 font-mono bg-black/60 px-2 py-0.5 rounded">
                  High-contrast scan mode
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={stopScanner}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={captureScannedDocument}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900 cursor-pointer flex items-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Snap & Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stylus / Drawing Canvas Modal */}
      {isCanvasOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-5 max-w-3xl w-full shadow-2xl border border-white/60 space-y-4">
            <div className="flex items-center justify-between border-b border-white/40 pb-3">
              <div className="flex items-center space-x-2">
                <PenTool className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Handwriting & Smart Shapes Canvas</h3>
              </div>
              <button onClick={() => setIsCanvasOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
                ✕
              </button>
            </div>

            {/* Canvas Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white/60 backdrop-blur-md p-2.5 rounded-2xl border border-white/60 shadow-xs">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-slate-600">Color:</span>
                {['#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#1E293B'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setBrushColor(c)}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                      brushColor === c ? 'scale-110 border-indigo-600 shadow-xs' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-6 h-6 rounded-md border-0 cursor-pointer overflow-hidden shadow-xs"
                  title="Custom color"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-600">Width:</span>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20 cursor-pointer"
                />
              </div>

              <label className="flex items-center space-x-2 cursor-pointer font-semibold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-xl border border-indigo-100/60 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Shapes (Auto-straighten)</span>
                <input
                  type="checkbox"
                  checked={isSmartShapesEnabled}
                  onChange={(e) => setIsSmartShapesEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Drawing Canvas Area */}
            <div className="w-full h-84 border border-white/60 rounded-2xl overflow-hidden bg-white/90 shadow-inner">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawingStroke}
                onMouseMove={drawStroke}
                onMouseUp={endDrawingStroke}
                onMouseLeave={endDrawingStroke}
                onTouchStart={startDrawingStroke}
                onTouchMove={drawStroke}
                onTouchEnd={endDrawingStroke}
                className="w-full h-full cursor-crosshair touch-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-slate-400">
                Tip: Draw a circle, square, or triangle and hold briefly to auto-snap with Smart Shapes!
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsCanvasOpen(false)}
                  className="px-4 py-2 bg-white/60 hover:bg-white/90 border border-white/60 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDrawing}
                  className="px-5 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md shadow-indigo-200/50"
                >
                  Attach Sketch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wiki Link Note Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 max-w-md w-full space-y-4 border border-white/60 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Link Note</h3>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 font-bold cursor-pointer">
                ✕
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {notes
                .filter((n) => n.id !== currentNote?.id)
                .map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleLinkNote(n.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/80 border border-white/40 bg-white/50 backdrop-blur-xs text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer transition-all shadow-xs"
                  >
                    <span>{n.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl p-6 max-w-md w-full space-y-4 border border-white/60 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/40 pb-3">
              <div className="flex items-center space-x-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: `${newFolderColor}25`, color: newFolderColor }}
                >
                  {renderFolderIcon(newFolderIcon, 'w-4 h-4')}
                </div>
                <h3 className="text-base font-bold text-slate-800">Create New Folder</h3>
              </div>
              <button
                onClick={() => setIsNewFolderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Folder Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Folder Name
              </label>
              <input
                type="text"
                placeholder="e.g. Class 10B Literature, Exams & Rubrics"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-white/70 backdrop-blur-md border border-white/60 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white/90 shadow-xs"
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Select Icon
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {FOLDER_ICON_OPTIONS.map((opt) => {
                  const isSelected = newFolderIcon === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNewFolderIcon(opt.id)}
                      className={`p-2 rounded-xl text-left flex items-center space-x-2 border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white/60 text-slate-700 border-white/60 hover:bg-white/90'
                      }`}
                    >
                      <div className={isSelected ? 'text-white' : 'text-slate-500'}>
                        {renderFolderIcon(opt.id, 'w-3.5 h-3.5')}
                      </div>
                      <span className="text-[10px] font-medium truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Folder Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newFolderColor}
                  onChange={(e) => setNewFolderColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border-0 cursor-pointer overflow-hidden shadow-xs shrink-0"
                  title="Pick hex color code"
                />
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {FOLDER_COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setNewFolderColor(p.hex)}
                      className={`w-6 h-6 rounded-lg border cursor-pointer transition-transform ${
                        newFolderColor.toLowerCase() === p.hex.toLowerCase()
                          ? 'scale-115 ring-2 ring-slate-800 shadow-xs'
                          : 'hover:scale-105 border-white/80'
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="p-3 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Preview:</span>
              <div
                className="px-3 py-1.5 rounded-xl font-bold flex items-center space-x-2 shadow-xs text-white"
                style={{ backgroundColor: newFolderColor }}
              >
                {renderFolderIcon(newFolderIcon, 'w-3.5 h-3.5')}
                <span>{newFolderName.trim() || 'New Folder'}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => {
                if (newFolderName.trim()) {
                  addFolder(newFolderName.trim(), newFolderIcon, newFolderColor);
                  setNewFolderName('');
                  setIsNewFolderModalOpen(false);
                }
              }}
              className="w-full py-2.5 bg-indigo-600/90 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-md shadow-indigo-200/50"
            >
              Create Folder
            </button>
          </div>
        </div>
      )}

      {/* Manage Folders Modal */}
      {isManageFoldersModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl p-6 max-w-lg w-full space-y-4 border border-white/60 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/40 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Note Folders</h3>
              </div>
              <button
                onClick={() => {
                  setEditingFolderId(null);
                  setIsManageFoldersModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Folder List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {folders.map((f) => {
                const isEditing = editingFolderId === f.id;
                const count = notes.filter((n) => n.folderId === f.id).length;
                const folderColor = f.color || '#4F46E5';

                if (isEditing) {
                  return (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-2xl bg-white border border-indigo-200 shadow-md space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700">Editing Folder</span>
                        <button
                          onClick={() => setEditingFolderId(null)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <input
                        type="text"
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        placeholder="Folder Name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />

                      {/* Icon options */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 mb-1">Icon:</span>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {FOLDER_ICON_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setEditFolderIcon(opt.id)}
                              className={`p-1.5 rounded-lg border shrink-0 cursor-pointer ${
                                editFolderIcon === opt.id
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={opt.label}
                            >
                              {renderFolderIcon(opt.id, 'w-3.5 h-3.5')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color options */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 mb-1">Color:</span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={editFolderColor}
                            onChange={(e) => setEditFolderColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border-0 cursor-pointer overflow-hidden shrink-0"
                          />
                          <div className="flex flex-wrap gap-1">
                            {FOLDER_COLOR_PRESETS.map((p) => (
                              <button
                                key={p.hex}
                                type="button"
                                onClick={() => setEditFolderColor(p.hex)}
                                className="w-5 h-5 rounded-md border border-white/60 cursor-pointer hover:scale-110"
                                style={{ backgroundColor: p.hex }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (editFolderName.trim()) {
                            updateFolder(f.id, {
                              name: editFolderName.trim(),
                              color: editFolderColor,
                              icon: editFolderIcon,
                            });
                            setEditingFolderId(null);
                          }
                        }}
                        className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 cursor-pointer shadow-sm"
                      >
                        Save Folder Changes
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={f.id}
                    className="p-3 rounded-2xl bg-white/60 backdrop-blur-xs border border-white/60 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 mr-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-white"
                        style={{ backgroundColor: folderColor }}
                      >
                        {renderFolderIcon(f.icon, 'w-4 h-4')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{f.name}</h4>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: folderColor }}
                            title={folderColor}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {count} {count === 1 ? 'note' : 'notes'} • {f.icon || 'Folder'} • {folderColor}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingFolderId(f.id);
                          setEditFolderName(f.name);
                          setEditFolderColor(f.color || '#4F46E5');
                          setEditFolderIcon(f.icon || 'Folder');
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white/80 rounded-lg cursor-pointer"
                        title="Edit folder name, color, and icon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {folders.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete folder "${f.name}"? Contained notes will be moved to General.`)) {
                              deleteFolder(f.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete folder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Button */}
            <button
              onClick={() => {
                setEditingFolderId(null);
                setIsManageFoldersModalOpen(false);
                setNewFolderName('');
                setNewFolderColor('#4F46E5');
                setNewFolderIcon('Folder');
                setIsNewFolderModalOpen(true);
              }}
              className="w-full py-2.5 border border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-700 hover:bg-indigo-50/50 font-semibold text-xs rounded-2xl flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Folder</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
