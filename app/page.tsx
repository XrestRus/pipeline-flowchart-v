"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyData, getNodeData } from "@/lib/data";
import CustomFlowchart from "@/components/custom-flowchart";
import NodeModal from "@/components/node-modal";
import AddCompanyModal from "@/components/add-company-modal";
import { useAddCompanyModalListener } from "@/hooks/useAddCompanyModal";

// Расширяем тип данных для хранения ID компаний
interface CompanyWithId {
  id: number;
  name: string;
  comment: string;
}

interface CompanyDataWithIds {
  waiting: {
    companies: CompanyWithId[];
  };
  dropped: {
    companies: CompanyWithId[];
  };
}

// Типы для результата API
interface ApiCompany {
  id: number;
  name: string;
  node_id: string;
  status: "waiting" | "dropped";
  comment: string | null;
}

interface ApiResponse {
  success: boolean;
  data: ApiCompany[];
}

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [userCompanies, setUserCompanies] = useState<
    Record<string, CompanyDataWithIds>
  >({});
  const [companyCounts, setCompanyCounts] = useState<
    Record<string, { waiting: number; dropped: number }>
  >({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);

  // Define node connections for determining next nodes
  const nodeConnections = {
    selected: ["collecting"],
    collecting: ["submitted"],
    submitted: ["won"],
    won: ["preparation"],
    waiting: ["preparation"],
    preparation: ["mvp"],
    mvp: ["delivery"],
    delivery: ["support"],
    support: [],
  };

  // Function to get next nodes for a given node
  const getNextNodes = (nodeId: string): string[] => {
    return nodeConnections[nodeId as keyof typeof nodeConnections] || [];
  };

  // Загрузка компаний из БД при монтировании
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("/api/companies");
        if (!response.ok) {
          throw new Error("Failed to fetch companies");
        }

        const result = await response.json() as ApiResponse;

        // Преобразуем данные из БД в формат состояния
        const companiesByNode: Record<string, CompanyDataWithIds> = {};

        // Инициализация узлов
        const nodeIds = [
          "selected",
          "collecting",
          "submitted",
          "won",
          "waiting",
          "preparation",
          "mvp",
          "delivery",
          "support",
        ];

        nodeIds.forEach((nodeId) => {
          companiesByNode[nodeId] = {
            waiting: { companies: [] },
            dropped: { companies: [] },
          };
        });

        // Заполнение данными из БД
        result.data.forEach((company: ApiCompany) => {
          if (!companiesByNode[company.node_id]) {
            companiesByNode[company.node_id] = {
              waiting: { companies: [] },
              dropped: { companies: [] },
            };
          }

          if (company.status === "waiting" || company.status === "dropped") {
            companiesByNode[company.node_id][company.status].companies.push({
              id: company.id,
              name: company.name,
              comment: company.comment || ""
            });
          }
        });

        setUserCompanies(companiesByNode);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  // Calculate company counts for all nodes
  useEffect(() => {
    const nodeIds = [
      "selected",
      "collecting",
      "submitted",
      "won",
      "waiting",
      "preparation",
      "mvp",
      "delivery",
      "support",
    ];

    // Initialize all nodes with zeros first
    const counts: Record<string, { waiting: number; dropped: number }> = {};
    nodeIds.forEach((id) => {
      counts[id] = { waiting: 0, dropped: 0 };
    });

    // Then calculate actual counts
    nodeIds.forEach((nodeId) => {
      const userData = userCompanies[nodeId] || {
        waiting: { companies: [] },
        dropped: { companies: [] },
      };

      counts[nodeId] = {
        waiting: userData.waiting.companies.length,
        dropped: userData.dropped.companies.length,
      };
    });

    setCompanyCounts(counts);
  }, [userCompanies]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddCompany = async (
    nodeId: string,
    status: "waiting" | "dropped",
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: { file: File, description: string }[]
  ) => {
    try {
      // Отправляем запрос на API для сохранения компании в БД
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, nodeId, status, comment, docLink, tenderLink, tkpLink, deadlineDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add company");
      }

      // Получаем данные созданной компании, включая ID
      const responseData = await response.json();
      const newCompanyId = responseData.data.id;

      // Обновляем локальное состояние React
      setUserCompanies((prev) => {
        const nodeData = prev[nodeId] || {
          waiting: { companies: [] },
          dropped: { companies: [] },
        };

        return {
          ...prev,
          [nodeId]: {
            ...nodeData,
            [status]: {
              companies: [...nodeData[status].companies, { id: newCompanyId, name, comment }],
            },
          },
        };
      });

      // Если есть файлы для загрузки, загружаем их по одному
      if (filesToUpload && filesToUpload.length > 0) {
        for (const fileData of filesToUpload) {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('description', fileData.description);

          try {
            await fetch(`/api/companies/${newCompanyId}/files`, {
              method: 'POST',
              body: formData,
            });
          } catch (fileError) {
            console.error("Error uploading file:", fileError);
            // Продолжаем загрузку остальных файлов даже если один из них не удалось загрузить
          }
        }
      }
    } catch (error) {
      console.error("Error adding company:", error);
      // Можно добавить уведомление об ошибке для пользователя
    }
  };

  const handleAddCompanyToBeginning = async (
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: { file: File, description: string }[]
  ) => {
    // Определяем начальный узел
    const firstNodeId = "selected";
    const status: "waiting" | "dropped" = "waiting";

    // Вызываем общую функцию добавления
    await handleAddCompany(
      firstNodeId,
      status,
      name,
      comment,
      docLink,
      tenderLink,
      tkpLink,
      deadlineDate,
      filesToUpload
    );
  };

  const handleUpdateCompany = async (
    nodeId: string,
    status: "waiting" | "dropped",
    index: number,
    name: string,
    comment: string,
    docLink?: string | null,
    tenderLink?: string | null,
    tkpLink?: string | null,
    deadlineDate?: string | null,
    filesToUpload?: { file: File, description: string }[]
  ): Promise<void> => {
    try {
      // Получаем текущие данные из состояния
      const nodeData = userCompanies[nodeId] || {
        waiting: { companies: [] },
        dropped: { companies: [] },
      };

      // Теперь получаем ID компании напрямую из хранимых данных
      const company = nodeData[status].companies[index];
      if (!company) {
        throw new Error("Company not found");
      }

      const companyId = company.id;

      // Логирование данных для отладки
      console.log('handleUpdateCompany params:', {
        nodeId,
        status,
        index,
        name,
        comment,
        docLink,
        tenderLink,
        tkpLink,
        deadlineDate,
        hasFiles: filesToUpload && filesToUpload.length > 0
      });

      // Отправляем запрос на API для обновления компании в БД
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, nodeId, status, comment, docLink, tenderLink, tkpLink, deadlineDate }),
      });

      // Проверяем на ошибки и логируем ответ
      const responseText = await response.text();
      console.log('Server response text:', responseText);
      
      // Пробуем распарсить ответ как JSON
      let errorData;
      try {
        errorData = JSON.parse(responseText);
        console.log('Server response parsed:', errorData);
      } catch (parseError) {
        console.error('Error parsing server response:', parseError);
      }

      if (!response.ok) {
        throw new Error((errorData && errorData.error) || "Failed to update company");
      }

      // Обновляем локальное состояние React
      setUserCompanies((prev) => {
        const prevNodeData = prev[nodeId] || {
          waiting: { companies: [] },
          dropped: { companies: [] },
        };

        // Обновляем конкретную запись
        const userIndex = index;
        const newCompanies = [...prevNodeData[status].companies];

        newCompanies[userIndex] = {
          ...newCompanies[userIndex],
          name,
          comment
        };

        return {
          ...prev,
          [nodeId]: {
            ...prevNodeData,
            [status]: {
              companies: newCompanies,
            },
          },
        };
      });

      // Если есть файлы для загрузки, загружаем их по одному
      if (filesToUpload && filesToUpload.length > 0) {
        for (const fileData of filesToUpload) {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('description', fileData.description);

          try {
            await fetch(`/api/companies/${companyId}/files`, {
              method: 'POST',
              body: formData,
            });
          } catch (fileError) {
            console.error("Error uploading file:", fileError);
            // Продолжаем загрузку остальных файлов даже если один из них не удалось загрузить
          }
        }
      }
    } catch (error) {
      console.error("Error updating company:", error);
      // Можно добавить уведомление об ошибке для пользователя
      throw error; // Пробрасываем ошибку дальше, чтобы она была обработана в модальном окне
    }
  };

  const handleDeleteCompany = async (
    nodeId: string,
    status: "waiting" | "dropped",
    index: number
  ) => {
    try {
      // Получаем текущие данные из состояния
      const nodeData = userCompanies[nodeId] || {
        waiting: { companies: [] },
        dropped: { companies: [] },
      };

      // Теперь получаем ID компании напрямую из хранимых данных
      const company = nodeData[status].companies[index];
      if (!company) {
        throw new Error("Company not found");
      }

      const companyId = company.id;

      // Отправляем запрос на API для удаления компании из БД
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete company");
      }

      // Обновляем локальное состояние React
      setUserCompanies((prev) => {
        // Start with the current user data
        const newState = { ...prev };
        const nodeData = newState[nodeId] || {
          waiting: { companies: [] },
          dropped: { companies: [] },
        };

        // Удаляем запись по индексу
        const userIndex = index;
        const newCompanies = [...nodeData[status].companies];

        newCompanies.splice(userIndex, 1);

        // Обновляем состояние
        newState[nodeId] = {
          ...nodeData,
          [status]: {
            companies: newCompanies,
          },
        };

        return newState;
      });
    } catch (error) {
      console.error("Error deleting company:", error);
      // Можно добавить уведомление об ошибке для пользователя
    }
  };

  const handleMoveCompany = async (
    fromNodeId: string,
    toNodeId: string,
    fromStatus: "waiting" | "dropped",
    toStatus: "waiting" | "dropped",
    index: number
  ) => {
    try {
      // Получаем данные компании, которую перемещаем
      const userData = userCompanies[fromNodeId] || {
        waiting: { companies: [] },
        dropped: { companies: [] },
      };

      const companyData = userData[fromStatus].companies[index];
      if (!companyData) return;

      const companyId = companyData.id;
      const name = companyData.name;
      const comment = companyData.comment;

      // Получаем дополнительные данные о компании
      const companyResponse = await fetch(`/api/companies/${companyId}`);
      const companyDetails = await companyResponse.json();
      let docLink = null;
      let tenderLink = null;
      let tkpLink = null;
      let deadlineDate = null;
      
      if (companyResponse.ok && companyDetails.success && companyDetails.data) {
        docLink = companyDetails.data.doc_link;
        tenderLink = companyDetails.data.tender_link;
        tkpLink = companyDetails.data.tkp_link;
        deadlineDate = companyDetails.data.deadline_date;
      }

      // Отправляем запрос на API для обновления компании в БД
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          nodeId: toNodeId,
          status: toStatus,
          comment,
          fromNode: fromNodeId,
          fromStatus,
          docLink,
          tenderLink,
          tkpLink,
          deadlineDate
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to move company");
      }

      // Обновляем локальное состояние React
      setUserCompanies((prev) => {
        // Создаем копию текущего состояния
        const newState = { ...prev };

        // 1. Добавляем в целевой узел
        const toNodeData = newState[toNodeId] || {
          waiting: { companies: [] },
          dropped: { companies: [] },
        };

        newState[toNodeId] = {
          ...toNodeData,
          [toStatus]: {
            companies: [
              ...toNodeData[toStatus].companies,
              { id: companyId, name, comment }
            ],
          },
        };

        // 2. Удаляем из исходного узла
        // Обрабатываем случай, когда перемещаемся внутри одного узла (просто меняем статус)
        if (fromNodeId === toNodeId && fromStatus !== toStatus) {
          // Мы уже добавили в целевой статус, теперь удаляем из исходного
          const fromNodeData = newState[fromNodeId];

          // Удаляем запись по индексу
          const userIndex = index;
          const newCompanies = [...userData[fromStatus].companies];
          newCompanies.splice(userIndex, 1);

          // Обновляем исходный статус
          fromNodeData[fromStatus] = {
            companies: newCompanies,
          };
        }
        // Обрабатываем случай, когда перемещаемся между разными узлами
        else if (fromNodeId !== toNodeId) {
          // Удаляем из исходного узла
          const fromNodeData = newState[fromNodeId] || {
            waiting: { companies: [] },
            dropped: { companies: [] },
          };

          // Удаляем запись по индексу
          const userIndex = index;
          const newCompanies = [...userData[fromStatus].companies];
          newCompanies.splice(userIndex, 1);

          // Обновляем исходный узел
          newState[fromNodeId] = {
            ...fromNodeData,
            [fromStatus]: {
              companies: newCompanies,
            },
          };
        }

        return newState;
      });
    } catch (error) {
      console.error("Error moving company:", error);
      // Можно добавить уведомление об ошибке для пользователя
    }
  };

  // Используем хук для прослушивания события
  const handleOpenAddCompanyModal = useCallback(() => {
    setIsAddCompanyModalOpen(true);
  }, []);

  useAddCompanyModalListener(handleOpenAddCompanyModal);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="container mx-auto p-4 max-w-7xl flex-grow">
        <Card>
          <CardHeader>
            <CardTitle>Блок-схема проектного пайплайна</CardTitle>
          </CardHeader>
          <CardContent
            className="overflow-auto"
            style={{ height: "calc(100vh - 200px)" }}
          >
            <CustomFlowchart
              companyCounts={companyCounts}
              selectedNode={selectedNode}
              onNodeClick={handleNodeClick}
            />
          </CardContent>
        </Card>

        {selectedNode && (
          <NodeModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            nodeId={selectedNode}
            nodeTitle={getNodeTitle(selectedNode)}
            userCompanies={userCompanies}
            onUpdateCompany={handleUpdateCompany}
            onAddCompany={handleAddCompany}
            onDeleteCompany={handleDeleteCompany}
            onMoveCompany={handleMoveCompany}
            getNextNodes={getNextNodes}
          />
        )}

        <AddCompanyModal
          isOpen={isAddCompanyModalOpen}
          onClose={() => setIsAddCompanyModalOpen(false)}
          onAddCompany={handleAddCompanyToBeginning}
        />
      </main>
    </div>
  );
}

function getNodeTitle(nodeId: string): string {
  const nodeTitles: Record<string, string> = {
    selected: "Выбрали",
    collecting: "Собираем КП",
    submitted: "Подали КП",
    won: "Выграли КП",
    // waiting: "Ожидаем фидбека",
    preparation: "Подготовка к старту",
    mvp: "Делаем MVP",
    delivery: "Сдача MVP",
    support: "Техподдержка",
  };

  return nodeTitles[nodeId] || nodeId;
}
