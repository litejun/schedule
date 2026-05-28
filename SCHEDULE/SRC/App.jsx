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
import { 
  Heart, 
  Calendar as CalIcon, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Users, 
  Smile, 
  MessageCircle,
  FileText
} from 'lucide-react';

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
              <Heart className="w-5 h-5 fill-white" />
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
              <Smile className="w-4 h-4" />
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
              <User className="w-4 h-4" />
              남편
            </button>
            <button
              onClick={() => handleRoleChange('wife')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-200 font-medium ${
                myRole === 'wife' ? 'bg-rose-400 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              <User className="w-4 h-4" />
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
              <Smile className="w-5 h-5 text-rose-400" />
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
              <MessageCircle className="w-5 h-5 text-indigo-400" />
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
                  <FileText className="w-8 h-8 mb-2 opacity-55" />
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
                          <Trash2 className="w-3.5 h-3.5" />
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
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold text-slate-800">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={setToday} className="px-4 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">오늘</button>
              <button onClick={() => openAddModal(new Date())} className="flex items-center gap-1 px-4 py-1.5 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600">
                <Plus className="w-4 h-4" /> 일정 추가
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
                              <Trash2 className="w-3 h-3" />
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