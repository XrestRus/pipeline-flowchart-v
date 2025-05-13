"use client"

import { useState } from "react"

interface FlowchartNodeProps {
  id: string
  title: string
  x: number
  y: number
  width: number
  height: number
  waitingCount: number
  droppedCount: number
  isSelected: boolean
  onClick: (id: string) => void
}

interface FlowchartProps {
  companyCounts: Record<string, { waiting: number; dropped: number }>
  selectedNode: string | null
  onNodeClick: (id: string) => void
}

const NODE_WIDTH = 180
const NODE_HEIGHT = 80
const VERTICAL_GAP = 60

export default function CustomFlowchart({ companyCounts, selectedNode, onNodeClick }: FlowchartProps) {
  // Calculate SVG dimensions
  const svgWidth = 800
  const svgHeight = 800

  // Center point for the main vertical flow
  const centerX = svgWidth / 2

  // Define node positions and connections
  const nodes = [
    { id: "selected", title: "Выбрали", x: centerX, y: 50 },
    { id: "collecting", title: "Собираем КП", x: centerX, y: 50 + NODE_HEIGHT + VERTICAL_GAP },
    { id: "submitted", title: "Подали КП", x: centerX, y: 50 + (NODE_HEIGHT + VERTICAL_GAP) * 2 },
    { id: "won", title: "Выграли КП", x: centerX - 150, y: 50 + (NODE_HEIGHT + VERTICAL_GAP) * 3 },
    { id: "waiting", title: "Ожидаем фидбека", x: centerX + 150, y: 50 + (NODE_HEIGHT + VERTICAL_GAP) * 3 },
    { id: "preparation", title: "Подготовка к старту", x: centerX, y: 50 + (NODE_HEIGHT + VERTICAL_GAP) * 4 },
    { id: "mvp", title: "Делаем MVP", x: centerX, y: 50 + (NODE_HEIGHT + VERTICAL_GAP) * 5 },
    { id: "delivery", title: "Сдача MVP", x: centerX, y: 50 + (NODE_HEIGHT + VERTICAL_GAP) * 6 },
    { id: "support", title: "Техподдержка", x: centerX, y: 50 + (NODE_HEIGHT + VERTICAL_GAP) * 7 },
  ]

  // Define connections between nodes
  const connections = [
    { from: "selected", to: "collecting" },
    { from: "collecting", to: "submitted" },
    { from: "submitted", to: "won" },
    { from: "submitted", to: "waiting" },
    { from: "won", to: "preparation" },
    { from: "waiting", to: "preparation" },
    { from: "preparation", to: "mvp" },
    { from: "mvp", to: "delivery" },
    { from: "delivery", to: "support" },
  ]

  return (
    <div className="flex justify-center">
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto">
        {/* Render connections */}
        {connections.map((connection, index) => {
          const fromNode = nodes.find((n) => n.id === connection.from)
          const toNode = nodes.find((n) => n.id === connection.to)

          if (!fromNode || !toNode) return null

          // Calculate connection points
          const startX = fromNode.x
          const startY = fromNode.y + NODE_HEIGHT
          const endX = toNode.x
          const endY = toNode.y

          // For diagonal connections
          const isVertical = startX === endX
          const path = isVertical
            ? `M${startX},${startY} L${endX},${endY}`
            : `M${startX},${startY} C${startX},${startY + 30} ${endX},${endY - 30} ${endX},${endY}`

          return <path key={index} d={path} stroke="#333" strokeWidth="2" fill="none" />
        })}

        {/* Render nodes */}
        {nodes.map((node) => {
          const counts = companyCounts[node.id] || { waiting: 0, dropped: 0 }
          const isSelected = selectedNode === node.id

          return (
            <FlowchartNode
              key={node.id}
              id={node.id}
              title={node.title}
              x={node.x - NODE_WIDTH / 2}
              y={node.y}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              waitingCount={counts.waiting}
              droppedCount={counts.dropped}
              isSelected={isSelected}
              onClick={onNodeClick}
            />
          )
        })}
      </svg>
    </div>
  )
}

function FlowchartNode({
  id,
  title,
  x,
  y,
  width,
  height,
  waitingCount,
  droppedCount,
  isSelected,
  onClick,
}: FlowchartNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    onClick(id)
  }

  // Determine fill color based on selection and hover state
  let fillColor = "#f9f9f9"
  let strokeColor = "#333"
  let strokeWidth = 1

  if (isSelected) {
    fillColor = "#d4edda"
    strokeColor = "#28a745"
    strokeWidth = 2
  } else if (isHovered) {
    fillColor = "#f8f9fa"
    strokeWidth = 1.5
  }

  return (
    <g
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={5}
        ry={5}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      <text x={x + width / 2} y={y + 25} textAnchor="middle" fontWeight="bold" fontSize="14">
        {title}
      </text>
      <text x={x + width / 2} y={y + 50} textAnchor="middle" fontSize="12">
        Ожидает: {waitingCount} | Выбыли: {droppedCount}
      </text>
    </g>
  )
}
