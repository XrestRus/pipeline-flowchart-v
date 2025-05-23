"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { CompanyHistoryTimeline } from "@/components/company-history-timeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Страница для отображения истории логов компании
 */
function _CompanyHistoryPage() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("id");
  const companyName = searchParams.get("name");

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyLogs = async () => {
      if (!companyId) {
        setError("ID компании не указан");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/companies/${companyId}/logs`);

        if (!response.ok) {
          throw new Error("Не удалось загрузить историю компании");
        }

        const data = await response.json();

        if (data.success) {
          setLogs(data.data);
        } else {
          throw new Error(data.error || "Ошибка при загрузке истории");
        }
      } catch (error: any) {
        setError(error.message || "Произошла ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyLogs();
  }, [companyId]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2"/>
              Назад к списку
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold">
          История компании {companyName || `#${companyId}`}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Временная шкала изменений</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">История изменений пуста</div>
          ) : (
            <CompanyHistoryTimeline logs={logs}/>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CompanyHistoryPageLoading() {
  return (
    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <div className="text-center">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span
            className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Загрузка...
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CompanyHistoryPage() {
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
          Вход в систему
        </h2>
      </div>

      <Suspense fallback={<CompanyHistoryPageLoading/>}>
        <_CompanyHistoryPage/>
      </Suspense>
    </div>
  );
}
