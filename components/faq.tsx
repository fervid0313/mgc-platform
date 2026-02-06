"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MessageCircleQuestion, Users, BookOpen, Settings, Shield, Zap, Star } from "lucide-react"

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqData: FAQItem[] = [
  {
    category: "Getting Started",
    question: "What is MGS (Mind · Grind · Scale)?",
    answer: "MGS is a trading journal and community platform designed for day traders, swing traders, investors, and e-commerce entrepreneurs. It helps you track performance, share insights, and grow together with a community of like-minded traders."
  },
  {
    category: "Getting Started",
    question: "How do I create my first journal entry?",
    answer: "Click the 'New Entry' button in the Journal tab, write about your trade or business activity, add relevant tags, and optionally include profit/loss data. You can also add mental state tracking to monitor your trading psychology."
  },
  {
    category: "Getting Started",
    question: "What's the difference between Journal and Community views?",
    answer: "Journal view shows your personal trading entries and allows you to create new entries. Community view displays profiles of other traders in your current space, allowing you to connect and learn from others."
  },
  {
    category: "Spaces & Community",
    question: "What are spaces?",
    answer: "Spaces are private or public groups where traders can share entries and connect. The Global Feed is public to all users, while private spaces require invitations to join."
  },
  {
    category: "Spaces & Community",
    question: "How do I join a private space?",
    answer: "You need an invitation link from a space member. Click the invitation link, and if you're not already a member, you'll be prompted to join the space."
  },
  {
    category: "Spaces & Community",
    question: "Can I create my own space?",
    answer: "Yes! You can create both public and private spaces. Public spaces are discoverable by anyone, while private spaces require invitation links for new members to join."
  },
  {
    category: "Trading Features",
    question: "What trading types are supported?",
    answer: "MGS supports day trading, swing trading, investment trading, and e-commerce business activities. You can categorize each entry accordingly."
  },
  {
    category: "Privacy & Security",
    question: "Is my trading data private?",
    answer: "Your entries are only visible to members of your current space. In private spaces, only invited members can see your content. In the Global Feed, all users can see entries."
  },
  {
    category: "Privacy & Security",
    question: "How is my data stored?",
    answer: "All data is securely stored using Supabase, which provides enterprise-grade security and encryption for your trading journal entries."
  },
  {
    category: "Troubleshooting",
    question: "Why do I see 'Unknown' as usernames sometimes?",
    answer: "This happens when profiles are still loading. The system automatically updates usernames as profile data becomes available. This should resolve within a few seconds."
  },
  {
    category: "Troubleshooting",
    question: "What should I do if the app seems slow?",
    answer: "Try refreshing the page. The app loads data progressively, so a refresh can help resolve any temporary loading issues."
  },
  {
    category: "Troubleshooting",
    question: "How do I report a bug or issue?",
    answer: "Contact the development team through the support channels available in the app. Include details about what you were doing when the issue occurred."
  }
]

const categoryIcons: Record<string, React.ReactNode> = {
  "Getting Started": <BookOpen className="h-4 w-4" />,
  "Spaces & Community": <Users className="h-4 w-4" />,
  "Trading Features": <Zap className="h-4 w-4" />,
  "Social Features": <Star className="h-4 w-4" />,
  "Privacy & Security": <Shield className="h-4 w-4" />,
  "Troubleshooting": <Settings className="h-4 w-4" />,
}

export function FAQ() {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const categories = ["All", ...Array.from(new Set(faqData.map(item => item.category)))]

  const filteredFAQs = selectedCategory === "All" 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory)

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <MessageCircleQuestion className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about MGS. Can't find what you're looking for? 
          Contact our support team for personalized help.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`btn-3d flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary/70"
            }`}
          >
            {category !== "All" && categoryIcons[category]}
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQs.map((item, index) => {
          const actualIndex = faqData.indexOf(item)
          const isExpanded = expandedItems.has(actualIndex)

          return (
            <div
              key={actualIndex}
              className="glass-3d lift-3d rounded-xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleExpanded(actualIndex)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {categoryIcons[item.category]}
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{item.question}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.category}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-6 pb-4 border-t border-border/50">
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center p-6 glass-3d rounded-xl">
        <h3 className="font-semibold mb-2">Still have questions?</h3>
        <p className="text-muted-foreground mb-4">
          We're here to help! Reach out to our support team for any additional questions or feedback.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MessageCircleQuestion className="h-4 w-4" />
          <span>Support available 24/7</span>
        </div>
      </div>
    </div>
  )
}
