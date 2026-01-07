'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import SpriteText from 'three-spritetext'

// Dynamic import to avoid SSR issues
const ForceGraph3DLib = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-xl">
      <div className="text-white text-center">
        <div className="text-4xl mb-2 animate-pulse">🌐</div>
        <div>Loading your profile...</div>
      </div>
    </div>
  )
})

export interface ProfileItem {
  id: number
  item_type: string
  value: string
  metadata: Record<string, unknown>
  confirmed: boolean
}

interface GraphNode {
  id: string
  type: 'user' | 'location' | 'role' | 'company' | 'skill'
  label: string
  profileItemId?: number
  data?: Record<string, unknown>
  // Force graph positioning
  x?: number
  y?: number
  z?: number
  fx?: number
  fy?: number
  fz?: number
}

interface GraphLink {
  source: string
  target: string
  label: string
}

// Node colors
const NODE_COLORS: Record<string, string> = {
  user: '#8B5CF6',      // Purple - center
  location: '#10B981',  // Emerald
  role: '#3B82F6',      // Blue
  company: '#EC4899',   // Pink
  skill: '#F59E0B',     // Amber
}

// Node sizes
const NODE_SIZES: Record<string, number> = {
  user: 20,
  location: 14,
  role: 14,
  company: 13,
  skill: 12,
}

interface Props {
  userId: string
  userName: string
  items: ProfileItem[]
  onEdit: (item: ProfileItem) => void
  onDelete: (item: ProfileItem) => void
  onAdd: (type: string) => void
  height?: number
}

export function EditableGraph3D({ userId, userName, items, onEdit, onDelete, onAdd, height = 400 }: Props) {
  const graphRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const container = document.getElementById('graph-container')
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height
        })
      }
    }
  }, [height])

  // Transform profile items to graph data
  const graphData = useCallback(() => {
    const nodes: GraphNode[] = [
      { id: 'user', type: 'user', label: userName }
    ]
    const links: GraphLink[] = []

    // Map item_type to node type
    const typeMap: Record<string, GraphNode['type']> = {
      location: 'location',
      role_preference: 'role',
      company: 'company',
      skill: 'skill',
    }

    // Edge labels
    const edgeLabels: Record<string, string> = {
      location: 'Based in',
      role_preference: 'Targeting',
      company: 'Worked at',
      skill: 'Skilled in',
    }

    items.forEach((item, i) => {
      const nodeType = typeMap[item.item_type] || 'skill'
      const nodeId = `item_${item.id}`

      nodes.push({
        id: nodeId,
        type: nodeType,
        label: item.value,
        profileItemId: item.id,
        data: item.metadata,
      })

      links.push({
        source: 'user',
        target: nodeId,
        label: edgeLabels[item.item_type] || 'Related',
      })
    })

    return { nodes, links }
  }, [items, userName])

  const data = graphData()

  // Initial camera setup
  useEffect(() => {
    if (graphRef.current && data.nodes.length > 0) {
      try {
        const camera = graphRef.current.camera()
        if (camera) {
          camera.position.set(0, 0, 250)
          camera.lookAt(0, 0, 0)
        }

        // Add lighting
        const scene = graphRef.current.scene()
        if (scene) {
          const ambientLight = new THREE.AmbientLight(0x404040, 2)
          scene.add(ambientLight)

          const light = new THREE.PointLight(0xFFFFFF, 1, 1000)
          light.position.set(100, 100, 100)
          scene.add(light)
        }
      } catch (e) {
        console.warn('EditableGraph3D init error:', e)
      }
    }
  }, [data.nodes.length])

  // Position user node at center
  useEffect(() => {
    if (!graphRef.current || !data.nodes) return

    const userNode = data.nodes.find(n => n.type === 'user') as any
    if (userNode) {
      userNode.fx = 0
      userNode.fy = 0
      userNode.fz = 0
    }
  }, [data.nodes])

  // Node appearance
  const nodeThreeObject = useCallback((node: any) => {
    const baseColor = NODE_COLORS[node.type] || '#666666'
    const size = NODE_SIZES[node.type] || 10
    const isSelected = selectedNode?.id === node.id

    const geometry = new THREE.SphereGeometry(size, 16, 16)
    const material = new THREE.MeshLambertMaterial({
      color: isSelected ? '#FFFFFF' : baseColor,
      emissive: node.type === 'user' ? baseColor : (isSelected ? baseColor : '#000000'),
      emissiveIntensity: node.type === 'user' ? 0.3 : (isSelected ? 0.5 : 0)
    })
    const mesh = new THREE.Mesh(geometry, material)

    // Add label
    const sprite = new SpriteText(node.label)
    sprite.color = '#FFFFFF'
    sprite.textHeight = 5
    sprite.position.set(0, size + 8, 0)
    mesh.add(sprite)

    // Add glow for user node or selected node
    if (node.type === 'user' || isSelected) {
      const glowGeometry = new THREE.SphereGeometry(size * 1.3, 16, 16)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: isSelected ? '#FFFFFF' : baseColor,
        transparent: true,
        opacity: isSelected ? 0.4 : 0.25
      })
      mesh.add(new THREE.Mesh(glowGeometry, glowMaterial))
    }

    // Add clickable indicator (ring) for editable nodes
    if (node.profileItemId) {
      const ringGeometry = new THREE.RingGeometry(size + 2, size + 4, 32)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI / 2
      mesh.add(ring)
    }

    return mesh
  }, [selectedNode])

  // Handle node click - select for editing
  const handleNodeClick = useCallback((node: any) => {
    if (node.type === 'user') {
      // User node - show add options
      setSelectedNode(null)
      return
    }

    if (node.profileItemId) {
      // Find the profile item
      const item = items.find(i => i.id === node.profileItemId)
      if (item) {
        setSelectedNode(node)
      }
    }
  }, [items])

  // Get selected item
  const selectedItem = selectedNode?.profileItemId
    ? items.find(i => i.id === selectedNode.profileItemId)
    : null

  if (!isClient) {
    return (
      <div className="w-full rounded-xl bg-gray-900 flex items-center justify-center" style={{ height }}>
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative" id="graph-container">
      {/* Graph */}
      <div className="rounded-xl overflow-hidden bg-gray-900 border border-gray-700">
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Your Profile Graph</h3>
            <p className="text-gray-400 text-xs">{data.nodes.length - 1} items • Click a node to edit</p>
          </div>
          <div className="flex gap-2">
            {['location', 'role', 'company', 'skill'].map(type => (
              <button
                key={type}
                onClick={() => onAdd(type === 'role' ? 'role_preference' : type)}
                className="px-2 py-1 text-xs rounded-full transition-colors"
                style={{
                  backgroundColor: `${NODE_COLORS[type]}20`,
                  color: NODE_COLORS[type],
                  border: `1px solid ${NODE_COLORS[type]}40`,
                }}
              >
                + {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <ForceGraph3DLib
          ref={graphRef}
          graphData={data}
          nodeThreeObject={nodeThreeObject}
          linkColor={() => 'rgba(255, 255, 255, 0.3)'}
          linkWidth={2}
          linkOpacity={0.6}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.005}
          onNodeClick={handleNodeClick}
          backgroundColor="#111827"
          showNavInfo={false}
          enableNavigationControls={true}
          width={dimensions.width}
          height={height - 60}
          warmupTicks={50}
          cooldownTime={500}
        />
      </div>

      {/* Edit Panel - slides in when node selected */}
      {selectedItem && (
        <div className="absolute right-4 top-16 w-64 bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden animate-in slide-in-from-right-4">
          <div
            className="px-4 py-3 border-b border-gray-700"
            style={{ backgroundColor: `${NODE_COLORS[selectedNode?.type || 'skill']}20` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-white font-medium capitalize">
                {selectedItem.item_type.replace('_', ' ')}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <label className="text-gray-400 text-xs uppercase tracking-wide">Value</label>
              <p className="text-white text-lg font-medium mt-1">{selectedItem.value}</p>
            </div>

            {selectedItem.metadata && Object.keys(selectedItem.metadata).length > 0 && (
              <div className="mb-4">
                <label className="text-gray-400 text-xs uppercase tracking-wide">Details</label>
                <div className="mt-1 text-sm text-gray-300">
                  {Object.entries(selectedItem.metadata).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace('_', ' ')}:</span>
                      <span>{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.confirmed && (
              <div className="mb-4 flex items-center gap-2 text-emerald-400 text-sm">
                <span>✓</span>
                <span>Confirmed</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onEdit(selectedItem)
                  setSelectedNode(null)
                }}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete(selectedItem)
                  setSelectedNode(null)
                }}
                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-600/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex gap-3 bg-gray-800/80 backdrop-blur px-3 py-2 rounded-lg">
        {Object.entries(NODE_COLORS).filter(([k]) => k !== 'user').map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-300 text-xs capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
