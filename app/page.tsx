"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CompanyData, getNodeData } from "@/lib/data"
import CustomFlowchart from "@/components/custom-flowchart"
import NodeModal from "@/components/node-modal"
import AddCompanyModal from "@/components/add-company-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [userCompanies, setUserCompanies] = useState<
    Record<string, CompanyData>
  >(getNodeData())
  const [companyCounts, setCompanyCounts] = useState<Record<string, { waiting: number; dropped: number }>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false)

  // Define node connections for determining next nodes
  const nodeConnections = {
    selected: ["collecting"],
    collecting: ["submitted"],
    submitted: ["won", "waiting"],
    won: ["preparation"],
    waiting: ["preparation"],
    preparation: ["mvp"],
    mvp: ["delivery"],
    delivery: ["support"],
    support: [],
  }

  // Function to get next nodes for a given node
  const getNextNodes = (nodeId: string): string[] => {
    return nodeConnections[nodeId as keyof typeof nodeConnections] || []
  }

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
    ]

    // Initialize all nodes with zeros first
    const counts: Record<string, { waiting: number; dropped: number }> = {}
    nodeIds.forEach((id) => {
      counts[id] = { waiting: 0, dropped: 0 }
    })

    // Then calculate actual counts
    nodeIds.forEach((nodeId) => {
      const userData = userCompanies[nodeId] || {
        waiting: { companies: [], comments: [] },
        dropped: { companies: [], comments: [] },
      }

      counts[nodeId] = {
        waiting: userData.waiting.companies.length,
        dropped: userData.dropped.companies.length,
      }
    })

    setCompanyCounts(counts)
  }, [userCompanies])

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleAddCompany = (nodeId: string, status: "waiting" | "dropped", company: string, comment: string) => {
    setUserCompanies((prev) => {
      const nodeData = prev[nodeId] || {
        waiting: { companies: [], comments: [] },
        dropped: { companies: [], comments: [] },
      }

      return {
        ...prev,
        [nodeId]: {
          ...nodeData,
          [status]: {
            companies: [...nodeData[status].companies, company],
            comments: [...nodeData[status].comments, comment],
          },
        },
      }
    })
  }

  const handleAddCompanyToBeginning = (company: string, comment: string) => {
    // Add to the "selected" node by default
    const nodeId = "selected"
    const status = "waiting"

    setUserCompanies((prev) => {
      const nodeData = prev[nodeId] || {
        waiting: { companies: [], comments: [] },
        dropped: { companies: [], comments: [] },
      }

      return {
        ...prev,
        [nodeId]: {
          ...nodeData,
          [status]: {
            companies: [company, ...nodeData[status].companies],
            comments: [comment, ...nodeData[status].comments],
          },
        },
      }
    })

    setIsAddCompanyModalOpen(false)
  }

  const handleUpdateCompany = (
    nodeId: string,
    status: "waiting" | "dropped",
    index: number,
    company: string,
    comment: string,
  ) => {
    setUserCompanies((prev) => {
      const nodeData = prev[nodeId] || {
        waiting: { companies: [], comments: [] },
        dropped: { companies: [], comments: [] },
      }

      // If editing user data, just update the specific entry
      const userIndex = index
      const newCompanies = [...nodeData[status].companies]
      const newComments = [...nodeData[status].comments]

      newCompanies[userIndex] = company
      newComments[userIndex] = comment

      return {
        ...prev,
        [nodeId]: {
          ...nodeData,
          [status]: {
            companies: newCompanies,
            comments: newComments,
          },
        },
      }
    })
  }

  const handleDeleteCompany = (nodeId: string, status: "waiting" | "dropped", index: number) => {
    // Create a new state update
    setUserCompanies((prev) => {
      // Start with the current user data
      const newState = { ...prev }
      const nodeData = newState[nodeId] || {
        waiting: { companies: [], comments: [] },
        dropped: { companies: [], comments: [] },
      }

      // We're deleting a user data item
      // Calculate the index in the user data array
      const userIndex = index

      // Create new arrays without the item to delete
      const newCompanies = [...nodeData[status].companies]
      const newComments = [...nodeData[status].comments]

      newCompanies.splice(userIndex, 1)
      newComments.splice(userIndex, 1)

      // Update the state
      newState[nodeId] = {
        ...nodeData,
        [status]: {
          companies: newCompanies,
          comments: newComments,
        },
      }

      return newState
    })
  }

  const handleMoveCompany = (
    fromNodeId: string,
    toNodeId: string,
    fromStatus: "waiting" | "dropped",
    toStatus: "waiting" | "dropped",
    index: number,
  ) => {
    // First, get the company data
    const userData = userCompanies[fromNodeId] || {
      waiting: { companies: [], comments: [] },
      dropped: { companies: [], comments: [] },
    }

    const mergedData = {
      waiting: {
        companies: [...userData.waiting.companies],
        comments: [...userData.waiting.comments],
      },
      dropped: {
        companies: [...userData.dropped.companies],
        comments: [...userData.dropped.comments],
      },
    }

    // Get the company and comment to move
    const company = mergedData[fromStatus].companies[index]
    const comment = mergedData[fromStatus].comments[index]

    if (!company) return

    // Use a single state update to avoid race conditions
    setUserCompanies((prev) => {
      // First, create a copy of the current state
      const newState = { ...prev }

      // 1. Add to destination node
      const toNodeData = newState[toNodeId] || {
        waiting: { companies: [], comments: [] },
        dropped: { companies: [], comments: [] },
      }

      newState[toNodeId] = {
        ...toNodeData,
        [toStatus]: {
          companies: [company, ...toNodeData[toStatus].companies],
          comments: [comment, ...toNodeData[toStatus].comments],
        },
      }

      // 2. Remove from source node
      // Handle the case where we're moving within the same node (just changing status)
      if (fromNodeId === toNodeId && fromStatus !== toStatus) {
        // We've already added to the destination status, now just need to remove from source status
        const fromNodeData = newState[fromNodeId]

        // If moving user data, just remove the specific entry
        const userIndex = index
        const newCompanies = [...userData[fromStatus].companies]
        const newComments = [...userData[fromStatus].comments]

        newCompanies.splice(userIndex, 1)
        newComments.splice(userIndex, 1)

        // Update the source status
        fromNodeData[fromStatus] = {
          companies: newCompanies,
          comments: newComments,
        }
      }
      // Handle the case where we're moving to a different node
      else if (fromNodeId !== toNodeId) {
        // Delete from source node using the same logic as handleDeleteCompany
        const fromNodeData = newState[fromNodeId] || {
          waiting: { companies: [], comments: [] },
          dropped: { companies: [], comments: [] },
        }

        // If moving user data, just remove the specific entry
        const userIndex = index
        const newCompanies = [...userData[fromStatus].companies]
        const newComments = [...userData[fromStatus].comments]

        newCompanies.splice(userIndex, 1)
        newComments.splice(userIndex, 1)

        // Update the source node
        newState[fromNodeId] = {
          ...fromNodeData,
          [fromStatus]: {
            companies: newCompanies,
            comments: newComments,
          },
        }
      }

      return newState
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 bg-white z-10 border-b shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Проектный Пайплайн</h1>
          <Button onClick={() => setIsAddCompanyModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Добавить компанию
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-7xl mt-16 flex-grow">
        <Card>
          <CardHeader>
            <CardTitle>Блок-схема проектного пайплайна</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto" style={{ height: "calc(100vh - 200px)" }}>
            <CustomFlowchart companyCounts={companyCounts} selectedNode={selectedNode} onNodeClick={handleNodeClick} />
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
  )
}

function getNodeTitle(nodeId: string): string {
  const nodeTitles: Record<string, string> = {
    selected: "Выбрали",
    collecting: "Собираем КП",
    submitted: "Подали КП",
    won: "Выграли КП",
    waiting: "Ожидаем фидбека",
    preparation: "Подготовка к старту",
    mvp: "Делаем MVP",
    delivery: "Сдача MVP",
    support: "Техподдержка",
  }

  return nodeTitles[nodeId] || nodeId
}
