'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from './api'

interface User {
  id: string
  email: string
  role: string
  org_id: string
}

interface Organization {
  id: string
  name: string
  currency: string
}

interface AuthContextType {
  user: User | null
  organizations: Organization[]
  currentOrg: Organization | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  switchOrg: (orgId: string) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      checkAuth()
    } else {
      setIsLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data)
      
      // Get organizations from stored data or fetch
      const storedOrgs = localStorage.getItem('organizations')
      if (storedOrgs) {
        const orgs = JSON.parse(storedOrgs)
        setOrganizations(orgs)
        setCurrentOrg(orgs.find((org: Organization) => org.id === response.data.org_id) || orgs[0])
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('organizations')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { token, user, organizations } = response.data
    
    localStorage.setItem('token', token)
    localStorage.setItem('organizations', JSON.stringify(organizations))
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    setUser(user)
    setOrganizations(organizations)
    setCurrentOrg(organizations[0])
    
    router.push('/dashboard')
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('organizations')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setOrganizations([])
    setCurrentOrg(null)
    router.push('/login')
  }

  const switchOrg = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setCurrentOrg(org)
      // In a real app, you'd need to update the user's context on the server
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      organizations,
      currentOrg,
      login,
      logout,
      switchOrg,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
