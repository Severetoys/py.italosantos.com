'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface SavedTwitterPhoto {
    id: string
    tweetId: string
    mediaKey: string
    username: string
    tweetText: string
    originalUrl: string
    storageUrl: string
    mediaType: string
    fileSize: number
    createdAt: any
    savedAt: any
}

interface PhotoStats {
    totalPhotos: number
    totalUsers: number
    totalSize: number
    oldestPhoto: string
    newestPhoto: string
    topUsers: Array<{ username: string; count: number }>
}

export default function TwitterPhotosPage() {
    const [photos, setPhotos] = useState<SavedTwitterPhoto[]>([])
    const [stats, setStats] = useState<PhotoStats | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchUsername, setSearchUsername] = useState('')
    const [currentAction, setCurrentAction] = useState<'all' | 'user' | 'stats'>('stats')

    const fetchPhotos = async (action: 'all' | 'user' | 'stats', username?: string) => {
        setLoading(true)
        try {
            let url = `/api/twitter-photos?action=${action}&limit=50`
            if (username && action === 'user') {
                url += `&username=${encodeURIComponent(username)}`
            }

            const response = await fetch(url)
            const result = await response.json()

            if (result.success) {
                if (action === 'stats') {
                    setStats(result.data)
                    setPhotos([])
                } else {
                    setPhotos(result.data)
                    setStats(null)
                }
            } else {
                console.error('Erro ao buscar dados:', result.error)
            }
        } catch (error) {
            console.error('Erro na requisição:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPhotos('stats')
    }, [])

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A'
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        return date.toLocaleString('pt-BR')
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Twitter Photos Database</h1>
                <div className="flex gap-2">
                    <Button 
                        variant={currentAction === 'stats' ? 'default' : 'outline'}
                        onClick={() => {
                            setCurrentAction('stats')
                            fetchPhotos('stats')
                        }}
                    >
                        📊 Estatísticas
                    </Button>
                    <Button 
                        variant={currentAction === 'all' ? 'default' : 'outline'}
                        onClick={() => {
                            setCurrentAction('all')
                            fetchPhotos('all')
                        }}
                    >
                        📷 Todas as Fotos
                    </Button>
                </div>
            </div>

            {/* Busca por usuário */}
            <Card>
                <CardHeader>
                    <CardTitle>🔍 Buscar Fotos por Usuário</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Digite o username (sem @)"
                            value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchUsername.trim()) {
                                    setCurrentAction('user')
                                    fetchPhotos('user', searchUsername.trim())
                                }
                            }}
                        />
                        <Button 
                            onClick={() => {
                                if (searchUsername.trim()) {
                                    setCurrentAction('user')
                                    fetchPhotos('user', searchUsername.trim())
                                }
                            }}
                            disabled={!searchUsername.trim() || loading}
                        >
                            Buscar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading && (
                <div className="text-center py-8">
                    <div className="text-lg">Carregando...</div>
                </div>
            )}

            {/* Estatísticas */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-2xl font-bold">{stats.totalPhotos}</div>
                            <div className="text-sm text-gray-600">Total de Fotos</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                            <div className="text-sm text-gray-600">Usuários Únicos</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
                            <div className="text-sm text-gray-600">Tamanho Total</div>
                        </CardContent>
                    </Card>
                    
                    {stats.topUsers && stats.topUsers.length > 0 && (
                        <Card className="md:col-span-2 lg:col-span-3">
                            <CardHeader>
                                <CardTitle>👥 Top Usuários</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                    {stats.topUsers.map((user, index) => (
                                        <div key={user.username} className="flex items-center gap-2">
                                            <Badge variant="outline">#{index + 1}</Badge>
                                            <span className="font-medium">@{user.username}</span>
                                            <Badge>{user.count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Lista de fotos */}
            {photos.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            📷 Fotos Salvas 
                            {currentAction === 'user' && (
                                <span className="text-sm font-normal"> - @{searchUsername}</span>
                            )}
                            <Badge className="ml-2">{photos.length} fotos</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {photos.map((photo) => (
                                <div key={photo.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                        <img 
                                            src={photo.storageUrl} 
                                            alt={`Foto de @${photo.username}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = photo.originalUrl
                                            }}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">@{photo.username}</Badge>
                                            <Badge variant="secondary">{formatFileSize(photo.fileSize)}</Badge>
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 line-clamp-2">
                                            {photo.tweetText}
                                        </div>
                                        
                                        <div className="text-xs text-gray-500">
                                            <div>Tweet ID: {photo.tweetId}</div>
                                            <div>Salvo: {formatDate(photo.savedAt)}</div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => window.open(photo.storageUrl, '_blank')}
                                            >
                                                Ver Original
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => window.open(`https://twitter.com/any/status/${photo.tweetId}`, '_blank')}
                                            >
                                                Ver Tweet
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {!loading && !stats && photos.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="text-gray-500">Nenhuma foto encontrada</div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
