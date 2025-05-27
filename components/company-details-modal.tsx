/**
 * Компонент модального окна для отображения и редактирования деталей компании
 * Теперь использует универсальную форму CompanyForm
 */
"use client"

import CompanyForm from "./CompanyForm"

interface FileToUpload {
  file: File;
  description: string;
}

interface CompanyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
  companyComment: string;
  nodeId: string;
  status: "waiting" | "dropped";
  index: number;
  onUpdateCompany: (
    nodeId: string,
    status: "waiting" | "dropped",
    index: number,
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: FileToUpload[]
  ) => Promise<void>;
}

export default function CompanyDetailsModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  companyComment,
  nodeId,
  status,
  index,
  onUpdateCompany,
}: CompanyDetailsModalProps) {
  return (
    <CompanyForm
      isOpen={isOpen}
      onClose={onClose}
      mode="edit"
      companyId={companyId}
      companyName={companyName}
      companyComment={companyComment}
      nodeId={nodeId}
      status={status}
      index={index}
      onUpdateCompany={onUpdateCompany}
    />
  );
}
