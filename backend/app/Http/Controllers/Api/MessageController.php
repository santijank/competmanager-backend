<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    /**
     * รายการสนทนาทั้งหมดของ user พร้อม unread count + ข้อความล่าสุด
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // ดึง participant records ของ user
        $myParticipants = ConversationParticipant::where('user_id', $user->id)
            ->get()
            ->keyBy('conversation_id');

        $conversationIds = $myParticipants->keys()->toArray();

        if (empty($conversationIds)) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $conversations = Conversation::whereIn('id', $conversationIds)
            ->with([
                'latestMessage.sender:id,name',
                'users:id,name,role',
            ])
            ->get();

        // คำนวณ unread count ต่อ conversation
        $result = $conversations->map(function ($conv) use ($user, $myParticipants) {
            $participant = $myParticipants->get($conv->id);
            $lastRead = $participant?->last_read_at;

            // นับ unread
            $unreadQuery = Message::where('conversation_id', $conv->id)
                ->where('sender_id', '!=', $user->id);

            if ($lastRead) {
                $unreadQuery->where('created_at', '>', $lastRead);
            }

            $unreadCount = $unreadQuery->count();

            $otherUsers = $conv->users->where('id', '!=', $user->id);
            $displayName = $conv->name;

            if ($conv->type === 'private') {
                $other = $otherUsers->first();
                $displayName = $other ? $other->name : 'ผู้ใช้ที่ถูกลบ';
            } elseif ($conv->type === 'broadcast') {
                $displayName = $conv->name ?: 'ห้องสนทนารวม';
            }

            return [
                'id' => $conv->id,
                'type' => $conv->type,
                'name' => $displayName,
                'participants' => $otherUsers->map(fn($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'role' => $u->role,
                ])->values(),
                'participant_count' => $conv->users->count(),
                'latest_message' => $conv->latestMessage ? [
                    'id' => $conv->latestMessage->id,
                    'content' => mb_substr($conv->latestMessage->content, 0, 100),
                    'sender_name' => $conv->latestMessage->sender->name ?? 'ไม่ทราบ',
                    'created_at' => $conv->latestMessage->created_at,
                ] : null,
                'unread_count' => $unreadCount,
                'updated_at' => $conv->latestMessage?->created_at ?? $conv->created_at,
            ];
        });

        // เรียงตามข้อความล่าสุด
        $sorted = $result->sortByDesc('updated_at')->values();

        return response()->json([
            'success' => true,
            'data' => $sorted,
        ]);
    }

    /**
     * สร้างสนทนาใหม่ (private หรือ group)
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:private,group',
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'name' => 'nullable|string|max:255',
            'message' => 'nullable|string',
        ]);

        $user = $request->user();
        $type = $request->type;
        $userIds = $request->user_ids;

        // Private: เช็คว่ามีสนทนาระหว่าง 2 คนนี้แล้วหรือยัง
        if ($type === 'private') {
            if (count($userIds) !== 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Private conversation ต้องเลือก 1 คน',
                ], 422);
            }

            $otherUserId = $userIds[0];

            if ($otherUserId == $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'ไม่สามารถสร้างสนทนากับตัวเองได้',
                ], 422);
            }

            // เช็คว่ามี private conversation ระหว่าง 2 คนนี้แล้วหรือยัง
            $existing = Conversation::where('type', 'private')
                ->whereHas('participants', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->whereHas('participants', function ($q) use ($otherUserId) {
                    $q->where('user_id', $otherUserId);
                })
                ->first();

            if ($existing) {
                // ส่งข้อความแรกถ้ามี
                if ($request->filled('message')) {
                    Message::create([
                        'conversation_id' => $existing->id,
                        'sender_id' => $user->id,
                        'content' => $request->message,
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'data' => ['id' => $existing->id],
                    'message' => 'ใช้สนทนาที่มีอยู่แล้ว',
                ]);
            }
        }

        // สร้างสนทนาใหม่
        $conversation = DB::transaction(function () use ($user, $type, $userIds, $request) {
            $conversation = Conversation::create([
                'type' => $type,
                'name' => $request->name,
                'created_by' => $user->id,
            ]);

            // เพิ่มตัวเอง
            ConversationParticipant::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'last_read_at' => now(),
            ]);

            // เพิ่มคนอื่น
            foreach ($userIds as $uid) {
                if ($uid != $user->id) {
                    ConversationParticipant::create([
                        'conversation_id' => $conversation->id,
                        'user_id' => $uid,
                    ]);
                }
            }

            // ส่งข้อความแรกถ้ามี
            if ($request->filled('message')) {
                Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $user->id,
                    'content' => $request->message,
                ]);
            }

            return $conversation;
        });

        return response()->json([
            'success' => true,
            'data' => ['id' => $conversation->id],
            'message' => 'สร้างสนทนาสำเร็จ',
        ], 201);
    }

    /**
     * ดึงข้อความในสนทนา (paginated)
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();

        $conversation = Conversation::findOrFail($id);

        // เช็คว่า user เป็น participant
        $participant = ConversationParticipant::where('conversation_id', $id)
            ->where('user_id', $user->id)
            ->first();

        // ถ้าเป็น broadcast ให้ auto-join
        if (!$participant && $conversation->type === 'broadcast') {
            $participant = ConversationParticipant::create([
                'conversation_id' => $id,
                'user_id' => $user->id,
            ]);
        }

        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่ได้อยู่ในสนทนานี้',
            ], 403);
        }

        $perPage = $request->get('per_page', 50);

        $messages = Message::where('conversation_id', $id)
            ->with([
                'sender:id,name,role',
                'replyTo:id,content,sender_id',
                'replyTo.sender:id,name',
            ])
            ->orderByDesc('created_at')
            ->paginate($perPage);

        // ข้อมูลสนทนา
        $convData = [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'name' => $conversation->name,
            'participants' => $conversation->users()
                ->select('users.id', 'users.name', 'users.role')
                ->get()
                ->map(fn($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'role' => $u->role,
                ]),
        ];

        return response()->json([
            'success' => true,
            'conversation' => $convData,
            'messages' => $messages,
        ]);
    }

    /**
     * ส่งข้อความในสนทนา
     */
    public function sendMessage(Request $request, $id)
    {
        $request->validate([
            'content' => 'required|string|max:5000',
            'reply_to_id' => 'nullable|exists:messages,id',
        ]);

        $user = $request->user();
        $conversation = Conversation::findOrFail($id);

        // เช็คว่า user เป็น participant
        $participant = ConversationParticipant::where('conversation_id', $id)
            ->where('user_id', $user->id)
            ->first();

        // ถ้าเป็น broadcast ให้ auto-join
        if (!$participant && $conversation->type === 'broadcast') {
            $participant = ConversationParticipant::create([
                'conversation_id' => $id,
                'user_id' => $user->id,
            ]);
        }

        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่ได้อยู่ในสนทนานี้',
            ], 403);
        }

        // ถ้ามี reply_to_id ตรวจสอบว่าอยู่ใน conversation เดียวกัน
        if ($request->reply_to_id) {
            $replyMsg = Message::where('id', $request->reply_to_id)
                ->where('conversation_id', $id)
                ->exists();

            if (!$replyMsg) {
                return response()->json([
                    'success' => false,
                    'message' => 'ข้อความที่ตอบกลับไม่อยู่ในสนทนานี้',
                ], 422);
            }
        }

        $message = Message::create([
            'conversation_id' => $id,
            'sender_id' => $user->id,
            'content' => $request->content,
            'reply_to_id' => $request->reply_to_id,
        ]);

        // Update last_read_at ของผู้ส่ง
        $participant->update(['last_read_at' => now()]);

        $message->load([
            'sender:id,name,role',
            'replyTo:id,content,sender_id',
            'replyTo.sender:id,name',
        ]);

        return response()->json([
            'success' => true,
            'data' => $message,
            'message' => 'ส่งข้อความสำเร็จ',
        ], 201);
    }

    /**
     * อ่านแล้ว (mark as read)
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();

        $participant = ConversationParticipant::where('conversation_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$participant) {
            return response()->json([
                'success' => false,
                'message' => 'คุณไม่ได้อยู่ในสนทนานี้',
            ], 403);
        }

        $participant->update(['last_read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'อ่านแล้ว',
        ]);
    }

    /**
     * จำนวน unread ทั้งหมด (สำหรับ badge)
     * Auto-join broadcast conversation ด้วย
     */
    public function unreadCount(Request $request)
    {
        $user = $request->user();

        // Auto-join broadcast conversation ถ้ายังไม่ได้เข้า
        $broadcast = Conversation::where('type', 'broadcast')->first();
        if ($broadcast) {
            $inBroadcast = ConversationParticipant::where('conversation_id', $broadcast->id)
                ->where('user_id', $user->id)
                ->exists();

            if (!$inBroadcast) {
                ConversationParticipant::create([
                    'conversation_id' => $broadcast->id,
                    'user_id' => $user->id,
                ]);
            }
        }

        $totalUnread = 0;

        $participants = ConversationParticipant::where('user_id', $user->id)->get();

        foreach ($participants as $p) {
            $query = Message::where('conversation_id', $p->conversation_id)
                ->where('sender_id', '!=', $user->id);

            if ($p->last_read_at) {
                $query->where('created_at', '>', $p->last_read_at);
            }

            $totalUnread += $query->count();
        }

        return response()->json([
            'success' => true,
            'unread_count' => $totalUnread,
        ]);
    }

    /**
     * ค้นหา user สำหรับเลือกส่งข้อความ
     */
    public function searchUsers(Request $request)
    {
        $user = $request->user();
        $search = $request->get('q', '');

        $query = User::where('id', '!=', $user->id)
            ->where('is_active', true)
            ->select('id', 'name', 'email', 'role', 'school_id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->with('school:id,name')
            ->orderBy('name')
            ->limit(500)
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'school_name' => $u->school?->name,
            ]);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * ดึงหรือสร้าง broadcast conversation
     */
    public function getBroadcast(Request $request)
    {
        $user = $request->user();

        $broadcast = Conversation::where('type', 'broadcast')->first();

        if (!$broadcast) {
            // สร้าง broadcast conversation
            $broadcast = Conversation::create([
                'type' => 'broadcast',
                'name' => 'ห้องสนทนารวม',
                'created_by' => $user->id,
            ]);
        }

        // Auto-join ถ้ายังไม่ได้เข้า
        $participant = ConversationParticipant::where('conversation_id', $broadcast->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$participant) {
            ConversationParticipant::create([
                'conversation_id' => $broadcast->id,
                'user_id' => $user->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => ['id' => $broadcast->id],
        ]);
    }
}
