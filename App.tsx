import React, { useState, useEffect, useRef, FormEvent } from 'react';
import * as firebaseAuth from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  doc, 
  updateDoc, 
  getDocs,
  setDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { auth, db, storage } from './firebase.ts';
import { UserProfile, Chat, Message } from './types.ts';
import { 
  LogOut, 
  Settings, 
  Plus, 
  Search, 
  Send, 
  Image as ImageIcon, 
  Users, 
  MessageSquare, 
  X,
  Menu,
  Moon,
  Sun,
  Loader2,
  Check
} from 'lucide-react';

const { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile 
} = firebaseAuth as any;

type User = any;

// --- Components ---

// 1. Auth Component
const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update generic profile
        await updateProfile(user, {
          displayName: name
        });

        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          photoURL: null,
          theme: 'light',
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Неверный email или пароль.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Этот email уже используется.');
      } else if (err.code === 'auth/weak-password') {
        setError('Пароль слишком слабый (минимум 6 символов).');
      } else {
        setError('Произошла ошибка: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-600 mb-2">RuApp</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isLogin ? 'С возвращением!' : 'Создайте новый аккаунт'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 flex justify-center items-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-600 hover:underline font-medium"
          >
            {isLogin ? 'Создать' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. Modals
interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ onClose, children, title }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

// 3. Main Messenger Component
const Messenger: React.FC<{ user: User }> = ({ user }) => {
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSearchUser, setShowSearchUser] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Form State for Modals
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [searchError, setSearchError] = useState('');
  
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const [settingsName, setSettingsName] = useState(user.displayName || '');
  const [settingsAvatar, setSettingsAvatar] = useState<File | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Responsive check
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
      else if (activeChat) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeChat]);

  // Load User Theme
  useEffect(() => {
    const loadTheme = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    loadTheme();
  }, [user.uid]);

  // Listen for Chats
  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessage.timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList: Chat[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Chat));
      setChats(chatList);
      setIsLoadingChats(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Listen for Messages
  useEffect(() => {
    if (!activeChat) return;

    const q = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));
      setMessages(msgs);
      // Mark scrolling
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsubscribe();
  }, [activeChat]);

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() && !groupImage) return; // Prevent empty send unless image
    if (!activeChat) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: msgText,
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        timestamp: serverTimestamp()
      });

      // Update last message
      await updateDoc(doc(db, "chats", activeChat.id), {
        lastMessage: {
          text: msgText,
          senderId: user.uid,
          timestamp: serverTimestamp()
        }
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleSearchUser = async () => {
    setSearchError('');
    setSearchResult(null);
    if (!searchEmail.trim()) return;

    try {
      const q = query(collection(db, "users"), where("email", "==", searchEmail.trim()));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const foundUser = snapshot.docs[0].data() as UserProfile;
        if (foundUser.uid === user.uid) {
          setSearchError("Вы не можете написать самому себе.");
        } else {
          setSearchResult(foundUser);
        }
      } else {
        setSearchError("Пользователь не найден.");
      }
    } catch (err) {
      setSearchError("Ошибка поиска.");
    }
  };

  const startDirectChat = async (targetUser: UserProfile) => {
    // Check if chat already exists
    const existingChat = chats.find(c => 
      c.type === 'direct' && c.participants.includes(targetUser.uid)
    );

    if (existingChat) {
      setActiveChat(existingChat);
    } else {
      // Create new chat
      const newChatRef = await addDoc(collection(db, "chats"), {
        type: 'direct',
        participants: [user.uid, targetUser.uid],
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        // We store display info for direct chats dynamically usually, but for simplicity let's rely on finding the other user
      });
      
      setActiveChat({
        id: newChatRef.id,
        type: 'direct',
        participants: [user.uid, targetUser.uid],
        createdAt: new Date(), // optimistically
        createdBy: user.uid
      });
    }
    setShowSearchUser(false);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    setIsCreatingGroup(true);

    try {
      let photoURL = '';
      if (groupImage) {
        const imageRef = ref(storage, `groups/${Date.now()}_${groupImage.name}`);
        await uploadBytes(imageRef, groupImage);
        photoURL = await getDownloadURL(imageRef);
      }

      const newGroupData = {
        type: 'group',
        name: groupName,
        description: groupDesc,
        participants: [user.uid],
        photoURL: photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(groupName)}&background=random`,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        lastMessage: {
           text: "Группа создана",
           senderId: "system",
           timestamp: serverTimestamp()
        }
      };

      const docRef = await addDoc(collection(db, "chats"), newGroupData);
      setActiveChat({ id: docRef.id, ...newGroupData } as any);
      setShowCreateGroup(false);
      setGroupName('');
      setGroupDesc('');
      setGroupImage(null);
      if (isMobile) setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSavingSettings(true);
    try {
      let photoURL = user.photoURL;

      if (settingsAvatar) {
        const imageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
        await uploadBytes(imageRef, settingsAvatar);
        photoURL = await getDownloadURL(imageRef);
      }

      await updateProfile(user, {
        displayName: settingsName,
        photoURL: photoURL
      });

      await updateDoc(doc(db, "users", user.uid), {
        displayName: settingsName,
        photoURL: photoURL
      });

      setShowSettings(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const toggleTheme = async () => {
    const isDark = document.documentElement.classList.toggle('dark');
    await updateDoc(doc(db, "users", user.uid), {
      theme: isDark ? 'dark' : 'light'
    });
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') return chat.name;
    // For direct chats, we need to fetch the other user's name ideally. 
    // In a real app we'd map participant IDs to UserProfiles.
    // For this demo, we'll assume the chat list logic should ideally cache user names.
    // Hack for demo: Just say "Личный чат" if not group, or try to implement a quick lookup if possible.
    // Or better: Let's store direct chat names in the chat object for the initiator? No, that's bad data design.
    // Let's rely on a helper hook or simply query users.
    // SIMPLIFICATION: Since we don't have a global user cache store implemented here, 
    // we will just show "Собеседник" if we can't easily get the name, or fetch it.
    // However, to make it strict to requirements, let's try to fetch it or just use "Личный чат".
    return "Личный чат"; 
  };
  
  // A helper to resolve direct chat name/avatar
  // Since we can't do async inside render, we usually need a component for the List Item.
  const ChatListItem: React.FC<{ chat: Chat; isSelected: boolean }> = ({ chat, isSelected }) => {
    const [name, setName] = useState(chat.name || 'Загрузка...');
    const [photo, setPhoto] = useState(chat.photoURL || '');

    useEffect(() => {
      if (chat.type === 'group') {
        setName(chat.name || 'Группа');
        setPhoto(chat.photoURL || '');
        return;
      }
      
      // Direct chat logic: find the other ID
      const otherId = chat.participants.find(uid => uid !== user.uid);
      if (otherId) {
        getDoc(doc(db, "users", otherId)).then(snap => {
          if (snap.exists()) {
            const d = snap.data();
            setName(d.displayName);
            setPhoto(d.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.displayName)}&background=random`);
          }
        });
      }
    }, [chat]);

    return (
      <div 
        onClick={() => {
          setActiveChat(chat);
          if (isMobile) setIsSidebarOpen(false);
        }}
        className={`flex items-center p-3 mb-2 rounded-xl cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-brand-500 text-white shadow-md' 
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
        }`}
      >
        <img 
          src={photo || 'https://via.placeholder.com/40'} 
          alt="Avatar" 
          className="w-12 h-12 rounded-full object-cover mr-3 bg-gray-300" 
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <h4 className="font-semibold truncate text-sm md:text-base">{name}</h4>
            {chat.lastMessage && (
              <span className={`text-xs ${isSelected ? 'text-brand-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {chat.lastMessage.timestamp ? new Date(chat.lastMessage.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
              </span>
            )}
          </div>
          <p className={`text-sm truncate ${isSelected ? 'text-brand-100' : 'text-gray-500 dark:text-gray-400'}`}>
             {chat.lastMessage ? chat.lastMessage.text : 'Нет сообщений'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden">
      
      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 fixed md:relative z-20 w-full md:w-80 lg:w-96 h-full 
        bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        transition-transform duration-300 flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <div className="flex items-center">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`} 
              className="w-10 h-10 rounded-full object-cover mr-3 cursor-pointer hover:opacity-80 transition"
              onClick={() => setShowSettings(true)}
              alt="My Avatar"
            />
            <h2 className="font-bold text-gray-800 dark:text-white truncate max-w-[120px]">{user.displayName}</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCreateGroup(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
              title="Создать группу"
            >
              <Users className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowSearchUser(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
              title="Найти пользователя"
            >
              <Plus className="w-5 h-5" />
            </button>
             <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
              title="Настройки"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoadingChats ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-brand-500" /></div>
          ) : chats.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 px-4">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>У вас пока нет чатов.</p>
              <button onClick={() => setShowSearchUser(true)} className="text-brand-600 mt-2 hover:underline">Найти собеседника</button>
            </div>
          ) : (
            chats.map(chat => (
              <ChatListItem key={chat.id} chat={chat} isSelected={activeChat?.id === chat.id} />
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative bg-gray-100 dark:bg-gray-900 w-full">
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Выберите чат</h3>
            <p className="text-center max-w-sm">Выберите чат из списка слева или начните новую беседу.</p>
            {isMobile && (
               <button 
                onClick={() => setIsSidebarOpen(true)}
                className="mt-6 px-6 py-2 bg-brand-600 text-white rounded-full shadow-lg"
               >
                 Открыть список чатов
               </button>
            )}
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center shadow-sm z-10">
              {isMobile && (
                <button onClick={() => setIsSidebarOpen(true)} className="mr-3 text-gray-600 dark:text-gray-300">
                  <Menu className="w-6 h-6" />
                </button>
              )}
              {/* This header also needs to resolve names properly, using simplified logic for now matching the list */}
              <div className="flex items-center">
                 <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold mr-3 overflow-hidden">
                    {activeChat.type === 'group' && activeChat.photoURL ? (
                      <img src={activeChat.photoURL} alt="" className="w-full h-full object-cover"/>
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 dark:text-white">
                     {activeChat.type === 'group' ? activeChat.name : 'Чат'} 
                     {/* Note: The Direct Chat name resolution is tricky without context, simplified for this view */}
                   </h3>
                   {activeChat.type === 'group' && (
                     <p className="text-xs text-gray-500 dark:text-gray-400">{activeChat.participants.length} участников</p>
                   )}
                 </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100 dark:bg-gray-900">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user.uid;
                const showAvatar = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                    {!isMe && (
                      <div className="w-8 flex-shrink-0 mr-2 flex flex-col justify-end">
                        {showAvatar ? (
                          <img 
                            src={msg.senderPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || 'U')}`} 
                            className="w-8 h-8 rounded-full" 
                            alt=""
                          />
                        ) : <div className="w-8" />}
                      </div>
                    )}
                    <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {(!isMe && showAvatar) && <span className="text-xs text-gray-500 ml-1 mb-1">{msg.senderName}</span>}
                      <div className={`
                        px-4 py-2 rounded-2xl shadow-sm text-sm break-words relative
                        ${isMe 
                          ? 'bg-brand-500 text-white rounded-br-none' 
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700'}
                      `}>
                        {msg.text}
                        <div className={`text-[10px] mt-1 text-right opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                           {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-4xl mx-auto">
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center px-4 py-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напишите сообщение..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 max-h-32"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full shadow-lg transition transform active:scale-95 flex items-center justify-center"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* --- Modals --- */}

      {/* 1. Create Group Modal */}
      {showCreateGroup && (
        <Modal title="Создать группу" onClose={() => setShowCreateGroup(false)}>
          <div className="space-y-4">
            <div className="flex justify-center mb-4">
              <label className="cursor-pointer relative group">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
                  {groupImage ? (
                    <img src={URL.createObjectURL(groupImage)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setGroupImage(e.target.files?.[0] || null)} />
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition">
                  Изменить
                </div>
              </label>
            </div>
            
            <input
              type="text"
              placeholder="Название группы"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            
            <input
              type="text"
              placeholder="Описание (необязательно)"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            <button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || isCreatingGroup}
              className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex justify-center"
            >
              {isCreatingGroup ? <Loader2 className="animate-spin" /> : 'Создать'}
            </button>
          </div>
        </Modal>
      )}

      {/* 2. Search User Modal */}
      {showSearchUser && (
        <Modal title="Найти собеседника" onClose={() => { setShowSearchUser(false); setSearchEmail(''); setSearchResult(null); }}>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email пользователя"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button 
                onClick={handleSearchUser}
                className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {searchError && <p className="text-red-500 text-sm">{searchError}</p>}

            {searchResult && (
              <div className="mt-4 p-3 border rounded-lg dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={searchResult.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(searchResult.displayName)}`} className="w-10 h-10 rounded-full" alt="" />
                  <div>
                    <p className="font-medium dark:text-white">{searchResult.displayName}</p>
                    <p className="text-xs text-gray-500">{searchResult.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => startDirectChat(searchResult)}
                  className="p-2 text-brand-600 hover:bg-brand-50 rounded-full"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 3. Settings Modal */}
      {showSettings && (
        <Modal title="Настройки" onClose={() => setShowSettings(false)}>
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <label className="cursor-pointer relative group">
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                   <img 
                      src={settingsAvatar ? URL.createObjectURL(settingsAvatar) : (user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}`)} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                   />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setSettingsAvatar(e.target.files?.[0] || null)} />
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm transition">
                  <ImageIcon className="w-6 h-6" />
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2">Нажмите на фото для изменения</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Отображаемое имя</label>
              <input
                type="text"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-900 dark:text-white font-medium">Тема оформления</span>
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                {document.documentElement.classList.contains('dark') ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={handleUpdateProfile}
                disabled={isSavingSettings}
                className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 flex justify-center items-center"
              >
                {isSavingSettings ? <Loader2 className="animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Сохранить изменения
              </button>
              
              <button
                onClick={() => signOut(auth)}
                className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 flex justify-center items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

// 4. Root App
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: any) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
      </div>
    );
  }

  return user ? <Messenger user={user} /> : <AuthPage />;
};

export default App;