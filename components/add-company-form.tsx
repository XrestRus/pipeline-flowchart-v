"use client"

import CompanyForm from "./CompanyForm"

interface FileToUpload {
  file: File;
  description: string;
}

interface AddCompanyFormProps {
  nodeId: string
  onAddCompany: (
    nodeId: string, 
    status: "waiting" | "dropped", 
    name: string, 
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: FileToUpload[]
  ) => Promise<void>
  defaultStatus?: "waiting" | "dropped"
}

/**
 * Компонент формы для добавления новой компании
 * Теперь использует универсальную форму CompanyForm
 */
export default function AddCompanyForm({ nodeId, onAddCompany, defaultStatus = "waiting" }: AddCompanyFormProps) {
  // Адаптер для преобразования вызова onAddCompany
  const handleAddCompany = async (
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: FileToUpload[],
    status?: "waiting" | "dropped"
  ) => {
    await onAddCompany(
      nodeId,
      status || defaultStatus,
      name,
      comment,
      docLink,
      tenderLink,
      tkpLink,
      deadlineDate,
      filesToUpload
    );
  };

  return (
    <div className="space-y-4">
      <CompanyForm
        isOpen={true}
        onClose={() => {}} // Для встроенной формы не нужно закрытие
        mode="add"
        onAddCompany={handleAddCompany}
        showStatusSelector={true}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
