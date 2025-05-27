"use client"

import CompanyForm from "./CompanyForm"

interface FileToUpload {
  file: File;
  description: string;
}

interface AddCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCompany: (
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: FileToUpload[]
  ) => Promise<void>
}

/**
 * Модальное окно для добавления новой компании
 * Теперь использует универсальную форму CompanyForm
 */
export default function AddCompanyModal({ isOpen, onClose, onAddCompany }: AddCompanyModalProps) {
  return (
    <CompanyForm
      isOpen={isOpen}
      onClose={onClose}
      mode="add"
      onAddCompany={onAddCompany}
    />
  );
}
