"use client"

import { useState, useEffect } from "react"
import { Brain, TrendingUp, BarChart3, Activity, Eye, Bell, Settings, X, ChevronDown, ChevronUp, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAppStore } from "@/lib/store"

// Import all analysis components
import SMTICTAnalysis from "./smt-ict-analysis"
import OrderFlowAnalysis from "./orderflow-analysis"
import VolumeProfileAnalysis from "./volume-profile-analysis"
import MarketStructureAnalysis from "./market-structure-analysis"
import MultiTimeframeAlignment from "./multi-timeframe-alignment"
import EconomicContext from "./economic-context"
import AIEnsemblePredictions from "./ai-ensemble-predictions"
import { RealTimeIntelligence } from "./realtime-intelligence"
import ActionableAlerts from "./actionable-alerts"
import MarketMicrostructure from "./market-microstructure"
import VisualEnhancements from "./visual-enhancements"

// Component categories with icons
const TOOL_CATEGORIES = {
  core: {
    name: "Core Analysis",
    icon: BarChart3,
    color: "blue",
    tools: [
      { id: "smt-ict", name: "SMT/ICT Analysis", component: SMTICTAnalysis },
      { id: "orderflow", name: "Order Flow", component: OrderFlowAnalysis },
      { id: "volume", name: "Volume Profile", component: VolumeProfileAnalysis },
      { id: "structure", name: "Market Structure", component: MarketStructureAnalysis },
    ]
  },
  advanced: {
    name: "Advanced Intelligence",
    icon: Brain,
    color: "purple",
    tools: [
      { id: "multi-timeframe", name: "Multi-Timeframe", component: MultiTimeframeAlignment },
      { id: "economic", name: "Economic Context", component: EconomicContext },
      { id: "ai", name: "AI Ensemble", component: AIEnsemblePredictions },
      { id: "microstructure", name: "Market Microstructure", component: MarketMicrostructure },
    ]
  },
  realtime: {
    name: "Real-Time",
    icon: Activity,
    color: "green",
    tools: [
      { id: "realtime", name: "Real-Time Intelligence", component: RealTimeIntelligence },
      { id: "alerts", name: "Actionable Alerts", component: ActionableAlerts },
      { id: "visual", name: "Visual Enhancements", component: VisualEnhancements },
    ]
  }
} as const

interface ToolButtonProps {
  tool: {
    id: string
    name: string
    component: React.ComponentType<any>
  }
  category: {
    name: string
    icon: React.ComponentType<any>
    color: string
  }
  isPinned?: boolean
  onPinToggle?: (toolId: string) => void
}

function ToolButton({ tool, category, isPinned, onPinToggle }: ToolButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = category.icon
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue": return "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
      case "purple": return "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
      case "green": return "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20"
    }
  }

  return (
    <div
      className={`relative group ${isPinned ? 'scale-105' : ''} transition-all duration-200`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => {
          // This will be handled by the parent component
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${getColorClasses(category.color)} shadow-md hover:shadow-lg`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="truncate max-w-[100px]">{tool.name}</span>
        
        {/* Pin indicator */}
        {isPinned && (
          <div className="absolute -top-1 -right-1">
            <Pin className="h-3 w-3 text-primary" fill="currentColor" />
          </div>
        )}
        
        {/* Hover indicator */}
        {isHovered && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-current rounded-full opacity-60"></div>
        )}
      </button>
      
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-background border border-border/50 rounded-lg shadow-lg z-50 whitespace-nowrap">
          <div className="text-xs font-medium text-foreground">{tool.name}</div>
          <div className="text-xs text-muted-foreground">Click to open</div>
        </div>
      )}
    </div>
  )
}

interface FloatingPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedTool: string | null
  onToolSelect: (toolId: string) => void
  pinnedTools: string[]
  onPinToggle: (toolId: string) => void
}

// Helper function moved outside component
function getToolById(toolId: string) {
  for (const category of Object.values(TOOL_CATEGORIES)) {
    const tool = category.tools.find(t => t.id === toolId)
    if (tool) return { tool, category }
  }
  return null
}

function FloatingPanel({ isOpen, onOpenChange, selectedTool, onToolSelect, pinnedTools, onPinToggle }: FloatingPanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  
  const selectedToolData = selectedTool ? getToolById(selectedTool) : null
  const SelectedComponent = selectedToolData?.tool?.component
  const getCategoryColorClasses = (color: string) => {
    switch (color) {
      case "blue": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "purple": return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "green": return "bg-green-500/10 text-green-400 border-green-500/20"
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto bg-background border-0 shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <Brain className="h-6 w-6 text-primary" />
            Intelligence Tools
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Advanced trading analysis tools at your fingertips
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Tool Categories */}
          {Object.entries(TOOL_CATEGORIES).map(([key, category]) => {
            const isExpanded = expandedCategory === key || selectedToolData?.category.name === category.name
            const hasPinnedTools = category.tools.some(tool => pinnedTools.includes(tool.id))
            
            return (
              <div key={key} className="border border-border/50 rounded-xl overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : key)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-background/50 transition-colors ${getCategoryColorClasses(category.color)}`}
                >
                  <div className="flex items-center gap-3">
                    <category.icon className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold text-foreground">{category.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {category.tools.length} tools
                        {hasPinnedTools && ` • ${category.tools.filter(t => pinnedTools.includes(t.id)).length} pinned`}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Tools List */}
                {isExpanded && (
                  <div className="p-4 space-y-2 bg-background/50">
                    {category.tools.map((tool) => {
                      const isSelected = selectedTool === tool.id
                      const isPinned = pinnedTools.includes(tool.id)
                      
                      return (
                        <button
                          key={tool.id}
                          onClick={() => onToolSelect(tool.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                            isSelected 
                              ? 'bg-primary/10 border-primary text-primary' 
                              : 'border-border/50 hover:border-border hover:bg-background/50'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${getCategoryColorClasses(category.color)}`}>
                            <category.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-foreground">{tool.name}</div>
                            <div className="text-xs text-muted-foreground">Click to open</div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onPinToggle(tool.id)
                            }}
                            className={`p-1 rounded hover:bg-background/50 transition-colors`}
                          >
                            <Pin className={`h-3 w-3 ${isPinned ? 'text-primary' : 'text-muted-foreground'}`} fill="currentColor" />
                          </button>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          
          {/* Selected Tool Display */}
          {selectedToolData && (
            <div className="border border-border/50 rounded-xl p-4 bg-background/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColorClasses(selectedToolData?.category?.color || 'blue')}`}>
                    {selectedToolData?.category?.icon && <selectedToolData.category.icon className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{selectedToolData?.tool?.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedToolData?.category?.name}</div>
                  </div>
                </div>
                <button
                  onClick={() => selectedTool && onPinToggle(selectedTool)}
                  className={`p-2 rounded-lg hover:bg-background/50 transition-colors ${
                    selectedTool && pinnedTools.includes(selectedTool) ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Pin className="h-4 w-4" fill="currentColor" />
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {SelectedComponent && <SelectedComponent />}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-6 p-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-muted-foreground">Core Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-xs text-muted-foreground">Advanced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-muted-foreground">Real-Time</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {pinnedTools.length} tools pinned
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function IntelligenceToolsPanel() {
  const [pinnedTools, setPinnedTools] = useState<string[]>([])
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const { isAuthenticated } = useAppStore()

  // Load pinned tools from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('intelligence-pinned-tools')
      if (saved) {
        try {
          setPinnedTools(JSON.parse(saved))
        } catch {
          console.error('Failed to load pinned tools')
        }
      }
    }
  }, [])

  // Save pinned tools to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('intelligence-pinned-tools', JSON.stringify(pinnedTools))
    }
  }, [pinnedTools])

  const handlePinToggle = (toolId: string) => {
    setPinnedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    )
  }

  const handleToolClick = (toolId: string) => {
    setActiveTool(activeTool === toolId ? null : toolId)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex flex-col gap-2">
        {/* Intelligence Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-background/80 border border-border/50 rounded-lg backdrop-blur-sm shadow-md">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-foreground">Intelligence Tools</span>
        </div>
        
        {/* All Tools as Buttons */}
        {Object.entries(TOOL_CATEGORIES).map(([categoryKey, category]) => {
          const Icon = category.icon
          const getColorClasses = (color: string) => {
            switch (color) {
              case "blue": return "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
              case "purple": return "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
              case "green": return "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
              default: return "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20"
            }
          }
          
          return (
            <div key={categoryKey} className="space-y-1">
              {/* Category Header */}
              <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${getColorClasses(category.color)} text-xs font-medium`}>
                <Icon className="h-3 w-3" />
                <span>{category.name}</span>
              </div>
              
              {/* Tool Buttons */}
              {category.tools.map((tool) => {
                const isPinned = pinnedTools.includes(tool.id)
                const isActive = activeTool === tool.id
                
                return (
                  <div key={tool.id} className="relative">
                    <button
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${getColorClasses(category.color)} shadow-sm hover:shadow-md ${
                        isPinned ? 'ring-2 ring-primary/50' : ''
                      } ${
                        isActive ? 'scale-105 ring-2 ring-primary/70' : ''
                      }`}
                      onClick={() => handleToolClick(tool.id)}
                    >
                      <Icon className="h-3 w-3" />
                      <span className="truncate max-w-[80px]">{tool.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePinToggle(tool.id)
                        }}
                        className="p-0.5 rounded hover:bg-background/50 transition-colors"
                      >
                        <Pin className={`h-3 w-3 ${isPinned ? 'text-primary' : 'text-muted-foreground/60'}`} fill="currentColor" />
                      </button>
                    </button>
                    
                    {/* Pop-out Tool Panel */}
                    {isActive && (
                      <div className="absolute left-full top-0 ml-2 w-80 bg-background border border-border/50 rounded-xl shadow-xl p-4 z-50 animate-in">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${getColorClasses(category.color)}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-sm">{tool.name}</div>
                              <div className="text-xs text-muted-foreground">{category.name}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTool(null)}
                            className="p-1 rounded hover:bg-background/50 transition-colors"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                        
                        {/* Tool Component */}
                        <div className="max-h-64 overflow-y-auto">
                          <tool.component />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
