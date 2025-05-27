/**
 * Компонент диалога подтверждения удаления пользователя
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type User = {
  id: number;
  username: string;
  full_name: string;
};

type DeleteUserDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (userId: number) => Promise<void>;
};

export default function DeleteUserDialog({
  isOpen,
  onClose,
  user,
  onConfirm,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Обработчик удаления
  const handleDelete = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);
      await onConfirm(user.id);
      onClose();
    } catch (error) {
      console.error("Ошибка удаления пользователя:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Отображаемое имя пользователя
  const displayName = user?.full_name || user?.username || "пользователя";

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Подтверждение удаления</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить {displayName}?
            <br />
            Пользователь будет деактивирован и не сможет войти в систему.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Удаление...
              </>
            ) : (
              "Удалить"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 