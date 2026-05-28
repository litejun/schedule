import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  onSnapshot 
} from 'firebase/firestore';

// ==========================================
// ★ 나의 Firebase 정보 입력하기 ★
// 아래 항목들을 본인의 Firebase 웹 앱 등록 정보로 채워주세요.
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCT35ovZk50Ym5JdBi9fU2Clb36RIWLVGM",
  authDomain: "couple-calendar-1cbd8.firebaseapp.com",
  projectId: "couple-calendar-1cbd8",
  storageBucket: "couple-calendar-1cbd8.firebasestorage.app",
  messagingSenderId: "774569979715",
  appId: "1:774569979715:web:0beefd85f4a994f57249f6"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 우리 부부만의 고유한 데이터 저장 공간 이름 (원하는 영문 닉네임으로 자유롭게 설정 가능)
const appId = 'our-precious-calendar-v1';

// ==========================================
// 자체 제작 SVG 아이콘 컴포넌트 (외부 라이브러리 에러 방지)
// ==========================================
const HeartIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
);

const CalIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ChevronLeftIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 18M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 2.25a3 3 0 11-6 0 3 3 0 016 0zM4.005 21.803A11.3 11.3 0 013 18c0-1.343.361-2.61.993-3.7M8.284 12.753A7.545 7.545 0 0112 11.25c1.24 0 2.42.298 3.465.83M12 11.25a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
  </svg>
);

const SmileIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
  </svg>
);

const MessageIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L12 21l3.62-3.144c1.153-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </svg>
);

const FileTextIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export default function App() {
  // --- 상태 관리 ---
  const [user, setUser] = useState(null);
  const [myRole, setMyRole] = useState(() => {
    return localStorage.getItem('couple_role') || 'husband';
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [memos, setMemos] = useState([]);
  const [anniversaryDate, setAnniversaryDate] = useState(() => {
    return localStorage.getItem('anniversary_date') || '2020-01-01';
  });
  
  // 모달 및 입력창 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('12:00');
  const [newEventMemo, setNewEventMemo] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('joint'); // husband, wife, joint
  
  // 수정용 임시 ID
  const [editingEventId, setEditingEventId] = useState(null);

  // 미니 알림판/메모용 입력창
  const [newMemoText, setNewMemoText] = useState('');

  // 커스텀 알림 모달 상태
  const [alertMessage, setAlertMessage] = useState(null);

  // --- Firebase 익명 인증 처리 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("인증 오류:", err);
        showAlert("Firebase 연동에 실패했습니다. FirebaseConfig가 올바른지 확인해주세요.");
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore 실시간 데이터 구독 ---
  useEffect(() => {
    if (!user) return;

    // 1. 일정(Events) 가져오기
    const eventsPath = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const unsubscribeEvents = onSnapshot(
      eventsPath,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setEvents(list);
      },
      (error) => {
        console.error("일정 불러오기 실패:", error);
        showAlert("데이터 로딩 중 오류가 발생했습니다. Firebase 규칙(Rules)을 확인해보세요.");
      }
    );

    // 2. 메모(Memos) 가져오기
    const memosPath = collection(db, 'artifacts', appId, 'public', 'data', 'memos');
    const unsubscribeMemos = onSnapshot(
      memosPath,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        setMemos(list);
      },
      (error) => {
        console.error("메모 불러오기 실패:", error);
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeMemos();
    };
  }, [user]);

  // --- 역할 변경 핸들러 ---
  const handleRoleChange = (role) => {
    setMyRole(role);
    localStorage.setItem('couple_role', role);
  };

  // --- 디데이 날짜 변경 핸들러 ---
  const handleAnniversaryChange = (e) => {
    const dateStr = e.target.value;
    setAnniversaryDate(dateStr);
    localStorage.setItem('anniversary_date', dateStr);
  };

  // --- 디데이 계산 ---
  const dDayCount = useMemo(() => {
    const start = new Date(anniversaryDate);
    const today = new Date();
    start.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = today.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [anniversaryDate]);

  // --- 달력 그리드 계산기 ---
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const days = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date: prevDate, isCurrentMonth: false, key: `prev-${prevMonthLastDay - i}` });
    }

    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true, key: `curr-${i}` });
    }

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false, key: `next-${i}` });
    }

    return days;
  }, [currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // --- 일정 추가/수정/삭제 핸들러 ---
  const openAddModal = (date) => {
    setSelectedDateStr(formatDateString(date));
    setNewEventTitle('');
    setNewEventTime('12:00');
    setNewEventMemo('');
    setNewEventCategory('joint');
    setEditingEventId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event, e) => {
    e.stopPropagation();
    setSelectedDateStr(event.date);
    setNewEventTitle(event.title);
    setNewEventTime(event.time || '12:00');
    setNewEventMemo(event.memo || '');
    setNewEventCategory(event.category || 'joint');
    setEditingEventId(event.id);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!user) {
      showAlert("Firebase 연결이 원활하지 않습니다.");
      return;
    }
    if (!newEventTitle.trim()) {
      showAlert("일정 제목을 입력해주세요!");
      return;
    }

    const eventData = {
      title: newEventTitle,
      date: selectedDateStr,
      time: newEventTime,
      memo: newEventMemo,
      category: newEventCategory,
      createdBy: myRole,
      updatedAt: Date.now()
    };

    try {
      const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
      if (editingEventId) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEventId);
        await updateDoc(docRef, eventData);
      } else {
        await addDoc(collectionRef, {
          ...eventData,
          createdAt: Date.now()
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("일정 저장 오류:", err);
      showAlert("일정을 저장하지 못했습니다.");
    }
  };

  const handleDeleteEvent = async (id, e) => {
    e.stopPropagation();
    if (!user) return;
    
    if (confirm("이 일정을 삭제하시겠습니까?")) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.error("삭제 오류:", err);
        showAlert("삭제에 실패했습니다.");
      }
    }
  };

  // --- 실시간 한마디 핸들러 ---
  const handleAddMemo = async (e) => {
    e.preventDefault();
    if (!newMemoText.trim() || !user) return;

    try {
      const memosPath = collection(db, 'artifacts', appId, 'public', 'data', 'memos');
      await addDoc(memosPath, {
        text: newMemoText,
        writer: myRole,
        createdAt: Date.now()
      });
      setNewMemoText('');
    } catch (err) {
      console.error("메모 저장 실패:", err);
    }
  };

  const handleDeleteMemo = async (id) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'memos', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("메모 삭제 실패:", err);
    }
  };

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(evt => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    Object.keys(map).forEach(date => {
      map[date].sort((a, b) => a.time.localeCompare(b.time));
    });
    return map;
  }, [events]);

  const showAlert = (message) => {
    setAlertMessage(message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 text-slate-800 pb-12 font-sans">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-rose-100/50 shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500 rounded-full text-white shadow-md animate-pulse">
              <HeartIcon className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-rose-500 to-sky-500 bg-clip-text text-transparent">
                우리 둘만의 커플 달력
              </h1>
              <p className="text-xs text-slate-500">실시간으로 일정을 기록하고 공유해요</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/90 border border-rose-100 rounded-full py-1.5 px-4 shadow-sm text-sm">
            <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
              <SmileIcon className="w-4 h-4" />
              <span>우리가 만난 지</span>
              <span className="text-base font-extrabold px-1 bg-rose-100 text-rose-600 rounded">
                D+{dDayCount}
              </span>
              <span>일</span>
            </div>
            <div className="text-slate-300">|</div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>시작일:</span>
              <input 
                type="date" 
                value={anniversaryDate} 
                onChange={handleAnniversaryChange}
                className="bg-transparent border-none p-0 focus:ring-0 text-slate-700 font-medium cursor-pointer max-w-[105px]" 
              />
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-full text-sm">
            <button
              onClick={() => handleRoleChange('husband')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-200 font-medium ${
                myRole === 'husband' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              남편
            </button>
            <button
              onClick={() => handleRoleChange('wife')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-200 font-medium ${
                myRole === 'wife' ? 'bg-rose-400 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              아내
            </button>
          </div>
        </div>
      </header>

      {/* 본문 레이아웃 */}
      <main className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* 캐릭터 프로필 */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100/40 shadow-sm">
            <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
              <SmileIcon className="w-5 h-5 text-rose-400" />
              오늘 나의 캐릭터
            </h2>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                myRole === 'husband' ? 'bg-sky-400' : 'bg-rose-400'
              }`}>
                {myRole === 'husband' ? '🤵' : '👰'}
              </div>
              <div>
                <div className="font-bold text-slate-800">
                  {myRole === 'husband' ? '남편님' : '아내님'}
                </div>
                <div className="text-xs text-green-500 flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                  실시간 공유 중
                </div>
              </div>
            </div>
          </div>

          {/* 한마디 톡 보드 */}
          <div className="bg-white rounded-2xl p-5 border border-rose-100/40 shadow-sm flex flex-col h-[380px]">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <MessageIcon className="w-5 h-5 text-indigo-400" />
              실시간 한마디 보드
            </h3>

            <form onSubmit={handleAddMemo} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="오늘 어떤가요?"
                  value={newMemoText}
                  onChange={(e) => setNewMemoText(e.target.value)}
                  maxLength={50}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none"
                />
                <button type="submit" className="px-3 py-2 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600">
                  등록
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2.5 text-sm">
              {memos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8">
                  <FileTextIcon className="w-8 h-8 mb-2 opacity-55" />
                  <span>실시간 메세지를 남겨보세요.</span>
                </div>
              ) : (
                memos.map((memo) => {
                  const isHusband = memo.writer === 'husband';
                  return (
                    <div 
                      key={memo.id}
                      className={`p-2.5 rounded-xl border relative group ${
                        isHusband ? 'bg-sky-50/50 border-sky-100 text-sky-900' : 'bg-rose-50/50 border-rose-100 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{isHusband ? '🤵 남편' : '👰 아내'}</span>
                        <button onClick={() => handleDeleteMemo(memo.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 absolute top-1.5 right-1.5">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="break-all whitespace-pre-wrap leading-relaxed pr-4 text-xs">{memo.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 메인 달력 */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-rose-100/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeftIcon className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold text-slate-800">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRightIcon className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={setToday} className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">오늘</button>
              <button onClick={() => openAddModal(new Date())} className="flex items-center gap-1 px-4 py-1.5 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600">
                <PlusIcon className="w-4 h-4" /> 일정 추가
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-rose-100/40 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 text-center text-xs font-semibold py-3">
              <div className="text-rose-500">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-sky-500">토</div>
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {calendarDays.map(({ date, isCurrentMonth, key }) => {
                const dateStr = formatDateString(date);
                const dayEvents = eventsByDate[dateStr] || [];
                const isToday = formatDateString(new Date()) === dateStr;

                return (
                  <div
                    key={key}
                    onClick={() => openAddModal(date)}
                    className={`min-h-[110px] p-1.5 hover:bg-rose-50/20 cursor-pointer flex flex-col justify-between group relative ${
                      isCurrentMonth ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        !isCurrentMonth ? 'text-slate-300' : isToday ? 'bg-rose-500 text-white' : 'text-slate-600'
                      }`}>{date.getDate()}</span>
                    </div>

                    <div className="flex-1 mt-1 space-y-1 overflow-y-auto max-h-[85px]">
                      {dayEvents.map((evt) => {
                        let catBg = 'bg-purple-50 text-purple-700 border-purple-100';
                        let catDot = 'bg-purple-400';
                        if (evt.category === 'husband') {
                          catBg = 'bg-sky-50 text-sky-700 border-sky-100';
                          catDot = 'bg-sky-400';
                        } else if (evt.category === 'wife') {
                          catBg = 'bg-rose-50 text-rose-700 border-rose-100';
                          catDot = 'bg-rose-400';
                        }

                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => openEditModal(evt, e)}
                            className={`px-1.5 py-0.5 rounded text-[10px] border flex items-center gap-1 justify-between group/item ${catBg}`}
                          >
                            <div className="flex items-center gap-1 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${catDot}`}></span>
                              <span className="font-semibold text-slate-500 shrink-0 text-[9px]">{evt.time}</span>
                              <span className="truncate font-medium">{evt.title}</span>
                            </div>
                            <button onClick={(e) => handleDeleteEvent(evt.id, e)} className="opacity-0 group-item-hover/item:opacity-100 text-slate-400 hover:text-red-500">
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* 일정 추가/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-rose-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CalIcon className="w-5 h-5 text-rose-500" />
              {editingEventId ? '일정 수정하기' : '새로운 일정 쓰기'}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">날짜</label>
                <input type="date" value={selectedDateStr} onChange={(e) => setSelectedDateStr(e.target.value)} className="w-full text-sm border rounded-xl px-3 py-2"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">일정 제목 *</label>
                <input type="text" placeholder="예: 저녁 외식 🥂" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} className="w-full text-sm border rounded-xl px-3 py-2.5" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">시간</label>
                  <input type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} className="w-full text-sm border rounded-xl px-3 py-2"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">대상</label>
                  <select value={newEventCategory} onChange={(e) => setNewEventCategory(e.target.value)} className="w-full text-sm border rounded-xl px-3 py-2">
                    <option value="joint">공동</option>
                    <option value="husband">남편</option>
                    <option value="wife">아내</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">메모</label>
                <textarea rows="2" placeholder="메모할 내용을 적어주세요." value={newEventMemo} onChange={(e) => setNewEventMemo(e.target.value)} className="w-full text-sm border rounded-xl px-3 py-2 resize-none"></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm">취소</button>
                <button type="submit" className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl text-sm font-semibold">{editingEventId ? '수정 완료' : '등록'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 알림 모달 */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <p className="text-slate-600 text-sm mb-4">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full py-2 bg-rose-500 text-white rounded-xl font-semibold text-sm">확인</button>
          </div>
        </div>
      )}
    </div>
  );
}