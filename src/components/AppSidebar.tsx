
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { MessageSquare, Plus, Settings, Brain, TrendingUp, BarChart3, Upload, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSavedChats } from "@/contexts/SavedChatsContext"
import { useChatContext } from "@/contexts/ChatContext"
import { Badge } from "@/components/ui/badge"
import SavedChatsPanel from "./SavedChatsPanel"
import DocumentUploadZone from "./DocumentUploadZone"
import { Link, useLocation } from "react-router-dom"

export function AppSidebar() {
  const { startNewConversation } = useChatContext()
  const location = useLocation()

  const handleNewChat = () => {
    startNewConversation()
  }

  const navigation = [
    {
      title: "Analytics",
      items: [
        { 
          title: "Incident Trends", 
          icon: TrendingUp, 
          path: "/analytics/incidents",
          badge: "Live Data" 
        },
        { 
          title: "Resolution Metrics", 
          icon: BarChart3, 
          path: "/analytics/resolution",
          badge: "AI Powered" 
        },
      ]
    },
    {
      title: "Tools",
      items: [
        { 
          title: "Upload Documents", 
          icon: Upload, 
          path: "/upload",
          badge: "Beta" 
        },
      ]
    }
  ]

  return (
    <Sidebar className="border-r bg-background w-80">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Think Tank AI</h2>
            <p className="text-xs text-muted-foreground">Knowledge Assistant</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* New Chat Button */}
        <SidebarGroup>
          <SidebarGroupContent>
            <Button 
              onClick={handleNewChat}
              className="w-full justify-start gap-2 h-9"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Chat History */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs flex items-center gap-2">
            <History className="h-3 w-3" />
            Recent Conversations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SavedChatsPanel className="border-0 bg-transparent p-0" />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Document Upload */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs flex items-center gap-2">
            <Upload className="h-3 w-3" />
            Upload Documents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <DocumentUploadZone />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Navigation */}
        {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-xs">{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className={`w-full justify-between ${
                        location.pathname === item.path ? 'bg-accent' : ''
                      }`}
                    >
                      <Link to={item.path}>
                        <div className="flex items-center gap-2">
                          <item.icon className="h-3 w-3" />
                          <span className="text-xs">{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs h-4 px-1">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full justify-start gap-2">
              <Settings className="h-3 w-3" />
              <span className="text-xs">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}
