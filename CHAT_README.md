# Chat Read/Unread Feature Implementation

## Overview
This implementation adds read/unread functionality to the chat system for both users and admins. Messages can now be marked as read or unread, and the UI shows visual indicators for unread messages.

## Changes Made

### 1. Database Schema
- Added `isRead` boolean field to the `Message` model in `prisma/schema.prisma`
- Field defaults to `false` (unread)

### 2. API Routes
- Updated message creation to support read status
- Created `/api/admin/chat/messages/mark-as-read` endpoint for admins to mark user messages as read
- Created `/api/chat/messages/mark-as-read` endpoint for users to mark admin messages as read
- Modified chat sessions endpoint to count unread messages

### 3. Frontend Components
- Updated `ChatButton` component (user chat) to show unread indicators
- Updated `ChatManagement` component (admin chat) to show unread indicators
- Added visual indicators (blue ring and "New" badge) for unread messages

## Pending Actions (After Database Migration)

### 1. Uncomment Code Blocks
Several code blocks have been commented out because the `isRead` field doesn't exist in the database yet. After running the migration, uncomment these sections:

#### In `app/api/chat/messages/route.ts`:
```typescript
const message = await prisma.message.create({
  data: {
    content: content || "📷 Image",
    imageUrl,
    userId: currentUser.id,
    isSupportMessage: false,
    isRead: false // Uncomment this line
  },
  // ...
})
```

#### In `app/api/admin/chat/messages/route.ts`:
```typescript
const message = await prisma.message.create({
  data: {
    content: content || "📷 Image",
    imageUrl,
    userId: userId,
    isSupportMessage: true,
    isRead: false // Uncomment this line
  },
  // ...
})
```

#### In `app/api/admin/chat/messages/mark-as-read/route.ts`:
```typescript
await prisma.message.updateMany({
  where: {
    id: { in: messageIds },
    userId: userId
  },
  data: {
    isRead: true // Uncomment this line
  }
})
```

#### In `app/api/chat/messages/mark-as-read/route.ts`:
```typescript
await prisma.message.updateMany({
  where: {
    id: { in: messageIds },
    userId: currentUser.id
  },
  data: {
    isRead: true // Uncomment this line
  }
})
```

#### In `app/api/admin/chat/sessions/route.ts`:
```typescript
_count: {
  select: {
    messages: {
      where: {
        isSupportMessage: false,
        isRead: false // Uncomment this line
      }
    }
  }
}
```

### 2. Run Database Migration
Run the following command to apply the schema changes:
```bash
npx prisma migrate dev --name add_read_status_to_messages
```

### 3. Generate Prisma Client
After migration, generate the updated Prisma client:
```bash
npx prisma generate
```

## Visual Indicators

### For Users
- Unread messages from support have a blue ring around them
- "New" badge appears next to "Support" label for unread messages

### For Admins
- Unread messages from users have a yellow ring around them
- "New" badge appears next to user name for unread messages

## How It Works

1. When a user sends a message, it's created with `isRead: false` (unread by admin)
2. When an admin sends a message, it's created with `isRead: false` (unread by user)
3. When a user opens the chat and loads messages, any unread admin messages are automatically marked as read
4. When an admin opens a user's chat, any unread user messages are automatically marked as read
5. Unread message counts are updated in real-time in the admin chat sessions list

## Files Modified
- `prisma/schema.prisma`
- `app/api/chat/messages/route.ts`
- `app/api/admin/chat/messages/route.ts`
- `app/api/admin/chat/sessions/route.ts`
- `app/api/admin/chat/messages/mark-as-read/route.ts`
- `app/api/chat/messages/mark-as-read/route.ts`
- `components/chat/chat-button.tsx`
- `components/admin/chat-management.tsx`