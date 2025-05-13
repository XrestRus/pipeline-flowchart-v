"use client"

import { useEffect, useRef } from "react"
import mermaid from "mermaid"

interface MermaidDiagramProps {
  onNodeClick: (nodeId: string) => void
  companyCounts?: Record<string, { waiting: number; dropped: number }>
}

export default function MermaidDiagram({ onNodeClick, companyCounts = {} }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
        diagramPadding: 8,
      },
    })

    const renderDiagram = async () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
        const { svg } = await mermaid.render("mermaid-diagram", getMermaidDefinition(companyCounts))
        containerRef.current.innerHTML = svg

        // Add click event listeners to nodes
        if (containerRef.current) {
          const nodes = containerRef.current.querySelectorAll(".node")
          nodes.forEach((node) => {
            node.addEventListener("click", () => {
              const nodeId = node.id.replace("flowchart-", "")
              onNodeClick(nodeId)
            })
            node.style.cursor = "pointer"
          })
        }
      }
    }

    renderDiagram()
  }, [onNodeClick, companyCounts])

  return (
    <div className="mermaid-container overflow-x-auto">
      <div ref={containerRef} className="mermaid"></div>
    </div>
  )
}

function getMermaidDefinition(companyCounts: Record<string, { waiting: number; dropped: number }> = {}) {
  // Helper function to format node label with counts
  function formatNodeLabel(title: string, nodeId: string) {
    const counts = companyCounts[nodeId] || { waiting: 0, dropped: 0 }
    // Always show the counts, even if they're zero
    return `${title}<br>Ожидает: ${counts.waiting} | Выбыли: ${counts.dropped}`
  }

  return `
    flowchart TD
      selected["${formatNodeLabel("Выбрали", "selected")}"]
      collecting["${formatNodeLabel("Собираем КП", "collecting")}"]
      submitted["${formatNodeLabel("Подали КП", "submitted")}"]
      won["${formatNodeLabel("Выграли КП", "won")}"]
      waiting["${formatNodeLabel("Ожидаем фидбека", "waiting")}"]
      preparation["${formatNodeLabel("Подготовка к старту", "preparation")}"]
      mvp["${formatNodeLabel("Делаем MVP", "mvp")}"]
      delivery["${formatNodeLabel("Сдача MVP", "delivery")}"]
      support["${formatNodeLabel("Техподдержка", "support")}"]

      selected --> collecting
      collecting --> submitted
      submitted --> won
      submitted --> waiting
      won --> preparation
      waiting --> preparation
      preparation --> mvp
      mvp --> delivery
      delivery --> support

      classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px;
      classDef active fill:#d4edda,stroke:#28a745,stroke-width:2px;
      classDef waiting fill:#fff3cd,stroke:#ffc107,stroke-width:2px;
  `
}
