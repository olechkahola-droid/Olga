import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Comment } from '../types';
import { MessageSquare, Send } from 'lucide-react';

export const RecipeComments = ({ recipeId }: { recipeId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'recipes', recipeId, 'comments'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      setComments(commentsData);
    });
    return () => unsubscribe();
  }, [recipeId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'recipes', recipeId, 'comments'), {
      recipeId,
      authorId: auth.currentUser.uid,
      text: newComment,
      createdAt: serverTimestamp()
    });
    setNewComment('');
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="w-5 h-5" /> Comments
      </h3>
      <div className="space-y-2">
        {comments.map(comment => (
          <div key={comment.id} className="bg-stone-100 dark:bg-stone-800 p-3 rounded-lg">
            <p className="text-sm">{comment.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 p-2 rounded-full border border-stone-200 dark:border-stone-700 bg-transparent"
        />
        <button onClick={handleAddComment} className="p-2 bg-stone-800 text-white rounded-full">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
