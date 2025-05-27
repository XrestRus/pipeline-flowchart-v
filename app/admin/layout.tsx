/**
 * Базовый layout для административной панели
 */
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Административная панель",
  description: "Управление системой Pipeline Flowchart",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col items-center min-h-screen pt-20 pb-10">
      {children}
    </main>
  );
}
