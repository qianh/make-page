import React, { useCallback, useMemo, useState } from 'react';
import { Card, Typography, Space, Empty, Button, Tooltip } from 'antd';
import { BranchesOutlined, ExpandOutlined, CompressOutlined, RedoOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// ReactFlow自定义样式
const reactFlowStyles = `
  .custom-mind-map-node .react-flow__handle {
    width: 1px !important;
    height: 1px !important;
    background: transparent !important;
    border: none !important;
    opacity: 0 !important;
  }
  
  .custom-mind-map-node button {
    pointer-events: auto !important;
  }
  
  .react-flow__edge {
    pointer-events: none !important;
  }
  
  .react-flow__edge-path {
    stroke: #00d4ff !important;
    stroke-width: 2px !important;
    stroke-opacity: 0.9 !important;
    fill: none !important;
    animation: flow 3s ease-in-out infinite;
  }
  
  .react-flow__arrowhead {
    fill: #00d4ff !important;
    opacity: 1 !important;
  }
  
  /* 流动动画效果 - 修复方向 */
  @keyframes flow {
    0% {
      stroke-dasharray: 8 4;
      stroke-dashoffset: 12;
    }
    100% {
      stroke-dasharray: 8 4;
      stroke-dashoffset: 0;
    }
  }
  
  /* ReactFlow内置动画边缘样式 */
  .react-flow__edge.animated .react-flow__edge-path {
    stroke-dasharray: 8 4 !important;
    animation: flow 2s linear infinite !important;
  }
  
  /* 边缘悬停效果 */
  .react-flow__edge:hover .react-flow__edge-path {
    stroke: #00bfff !important;
    stroke-width: 3px !important;
    stroke-opacity: 1 !important;
    animation: flowGlow 1.5s ease-in-out infinite !important;
  }
  
  @keyframes flowGlow {
    0%, 100% {
      filter: drop-shadow(0 0 3px rgba(0, 212, 255, 0.4));
    }
    50% {
      filter: drop-shadow(0 0 8px rgba(0, 212, 255, 0.8));
    }
  }
  
  .react-flow__edge .react-flow__edge-interaction {
    stroke: transparent !important;
    stroke-width: 20px !important;
  }
`;

const { Title, Text } = Typography;

// 自定义节点组件
const CustomMindMapNode = ({ data, id }) => {
  const { label, level, collapsed, onToggle, children } = data;
  
  const getNodeColor = (level) => {
    const colors = [
      '#4A90E2', // Level 1 - 蓝色
      '#50E3C2', // Level 2 - 青色
      '#F5A623', // Level 3 - 橙色
      '#D0021B', // Level 4 - 红色
      '#9013FE', // Level 5 - 紫色
      '#00BCD4'  // Level 6 - 青蓝色
    ];
    return colors[(level - 1) % colors.length] || '#666';
  };

  const nodeStyle = {
    background: `linear-gradient(135deg, ${getNodeColor(level)}, ${getNodeColor(level)}dd)`,
    color: '#fff',
    border: '2px solid #fff',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: Math.max(10, 16 - level * 2) + 'px',
    fontWeight: level === 1 ? 'bold' : 'normal',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: 'max-content',
    maxWidth: '200px',
    textAlign: 'center',
    position: 'relative'
  };

  return (
    <div 
      style={nodeStyle}
      className="custom-mind-map-node"
    >
      {/* 添加ReactFlow连接点 */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: 'transparent', border: 'none' }}
      />
      
      <div style={{ wordBreak: 'break-word', lineHeight: 1.4 }}>
        {label}
      </div>
      {children && children.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggle(id);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          style={{
            position: 'absolute',
            bottom: '-8px',
            right: '-8px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '2px solid #fff',
            background: getNodeColor(level),
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '12px',
            padding: 0,
            zIndex: 1000
          }}
        >
          {collapsed ? '+' : '−'}
        </button>
      )}
      <div style={{
        position: 'absolute',
        top: '-8px',
        left: '-8px',
        background: 'rgba(255,255,255,0.9)',
        color: getNodeColor(level),
        fontSize: '10px',
        padding: '2px 6px',
        borderRadius: '8px',
        border: `1px solid ${getNodeColor(level)}`,
        fontWeight: 'bold'
      }}>
        L{level}
      </div>
    </div>
  );
};

const nodeTypes = {
  mindMapNode: CustomMindMapNode,
};

// 美观的现代化思维导图组件
const ModernMindMap = ({ nodes, language }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  // 处理节点展开/折叠
  const handleToggleNode = useCallback((nodeId) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // 构建ReactFlow节点和边
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!nodes || nodes.length === 0) return { flowNodes: [], flowEdges: [] };
    
    // 输入数据日志（可在需要时启用）
    // console.log('Mind map nodes:', nodes.length);

    // 为每个节点添加子节点信息
    const nodeMap = new Map();
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });
    
    nodes.forEach(node => {
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id).children.push(node.id);
      }
    });

    // 转换为ReactFlow格式的节点
    const reactFlowNodes = [];
    const reactFlowEdges = [];
    
    // 层级布局计算
    const levelGroups = {};
    nodes.forEach(node => {
      if (!levelGroups[node.level]) {
        levelGroups[node.level] = [];
      }
      levelGroups[node.level].push(node);
    });

    // 为每个节点分配位置
    Object.keys(levelGroups).forEach(level => {
      const levelNodes = levelGroups[level];
      const levelNum = parseInt(level);
      
      levelNodes.forEach((node, index) => {
        const nodeData = nodeMap.get(node.id);
        const isCollapsed = collapsedNodes.has(node.id);
        
        // 过滤被折叠父节点的子节点
        let shouldShow = true;
        let currentNode = node;
        while (currentNode.parent_id) {
          const parent = nodes.find(n => n.id === currentNode.parent_id);
          if (parent && collapsedNodes.has(parent.id)) {
            shouldShow = false;
            break;
          }
          currentNode = parent;
        }
        
        if (shouldShow) {
          // 确保节点ID是唯一且有效的
          const nodeId = node.id !== undefined && node.id !== null 
            ? node.id.toString() 
            : `fallback-node-${levelNum}-${index}-${Math.random().toString(36).substr(2, 9)}`;
          
          // 节点创建日志（可在需要时启用）
          // console.log('Creating node:', nodeId, node.text);
          
          reactFlowNodes.push({
            id: nodeId,
            type: 'mindMapNode',
            position: {
              x: (levelNum - 1) * 250 + (levelNum > 1 ? (index - levelNodes.length / 2) * 50 : 0),
              y: index * 120 - (levelNodes.length - 1) * 60
            },
            data: {
              label: node.text,
              level: node.level,
              collapsed: isCollapsed,
              children: nodeData.children,
              onToggle: handleToggleNode
            },
            draggable: true
          });
        }
        
      });
    });

    // 创建边（基于已创建的ReactFlow节点）
    
    // 使用ReactFlow节点来创建边缘，而不是原始数据
    reactFlowNodes.forEach(childReactNode => {
      // 查找对应的原始节点数据来获取parent_id
      const originalChild = nodes.find(n => {
        const nodeId = n.id !== undefined && n.id !== null ? n.id.toString() : null;
        return nodeId === childReactNode.id || childReactNode.id.includes(n.text.slice(0, 5));
      });
      
      if (originalChild && originalChild.parent_id !== undefined && originalChild.parent_id !== null) {
        const parentId = originalChild.parent_id.toString();
        
        // 查找父节点是否在ReactFlow节点中
        const parentReactNode = reactFlowNodes.find(n => {
          const originalParent = nodes.find(on => {
            const nodeId = on.id !== undefined && on.id !== null ? on.id.toString() : null;
            return nodeId === n.id || n.id.includes(on.text.slice(0, 5));
          });
          return originalParent && originalParent.id !== undefined && 
                 originalParent.id !== null && originalParent.id.toString() === parentId;
        });
        
        // 父节点不能被折叠
        const parentNotCollapsed = !collapsedNodes.has(originalChild.parent_id);
        
        // 边缘检查日志（可在需要时启用）
        // console.log('Edge check:', originalChild.text);
        
        if (parentReactNode && parentNotCollapsed) {
          const edge = {
            id: `edge-${parentReactNode.id}-${childReactNode.id}`,
            source: parentReactNode.id,
            target: childReactNode.id,
            type: 'default',
            animated: true,
            style: {
              stroke: '#00d4ff',
              strokeWidth: 2,
              strokeOpacity: 0.9
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#00d4ff',
              width: 12,
              height: 12
            }
          };
          // console.log('Adding edge:', edge.id);
          reactFlowEdges.push(edge);
        }
      }
    });

    // 成功生成 ReactFlow 节点和边缘
    // console.log(`Generated ${reactFlowNodes.length} nodes and ${reactFlowEdges.length} edges`);
    return { flowNodes: reactFlowNodes, flowEdges: reactFlowEdges };
  }, [nodes, collapsedNodes, handleToggleNode]);

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);

  // 更新ReactFlow节点和边
  React.useEffect(() => {
    setReactFlowNodes(flowNodes);
    setReactFlowEdges(flowEdges);
  }, [flowNodes, flowEdges, setReactFlowNodes, setReactFlowEdges]);

  // 展开所有节点
  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
  }, []);

  // 折叠所有节点
  const handleCollapseAll = useCallback(() => {
    const allNonRootNodes = nodes.filter(node => node.level > 1).map(node => node.id);
    setCollapsedNodes(new Set(allNonRootNodes));
  }, [nodes]);

  // 切换全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div style={{
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        border: '1px solid var(--theme-border, rgba(0,0,0,0.06))'
      }}>
        <Empty 
          description={
            <Text style={{ color: '#fff' }}>
              {language === 'zh' ? '暂无思维导图数据' : 'No mind map data available'}
            </Text>
          }
          image={<BranchesOutlined style={{ fontSize: '48px', color: 'rgba(255,255,255,0.6)' }} />}
        />
      </div>
    );
  }

  return (
    <div style={{
      position: isFullscreen ? 'fixed' : 'relative',
      top: isFullscreen ? 0 : 'auto',
      left: isFullscreen ? 0 : 'auto',
      width: isFullscreen ? '100vw' : '100%',
      height: isFullscreen ? '100vh' : '500px',
      zIndex: isFullscreen ? 9999 : 'auto',
      background: isFullscreen ? '#000' : 'transparent',
      borderRadius: isFullscreen ? 0 : '12px',
      overflow: 'hidden'
    }}>
      {/* 自定义样式 */}
      <style>{reactFlowStyles}</style>
      
      {/* 工具栏 */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10,
        display: 'flex',
        gap: '8px'
      }}>
        <Tooltip title={language === 'zh' ? '展开所有节点' : 'Expand all nodes'}>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={handleExpandAll}
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '6px',
              backdropFilter: 'blur(4px)'
            }}
          />
        </Tooltip>
        <Tooltip title={language === 'zh' ? '折叠所有节点' : 'Collapse all nodes'}>
          <Button
            size="small"
            icon={<MinusOutlined />}
            onClick={handleCollapseAll}
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '6px',
              backdropFilter: 'blur(4px)'
            }}
          />
        </Tooltip>
        <Tooltip title={isFullscreen ? (language === 'zh' ? '退出全屏' : 'Exit fullscreen') : (language === 'zh' ? '全屏显示' : 'Fullscreen')}>
          <Button
            size="small"
            icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '6px',
              backdropFilter: 'blur(4px)'
            }}
          />
        </Tooltip>
      </div>
      
      {/* ReactFlow 思维导图 */}
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'default',
          animated: true,
          style: { stroke: '#00d4ff', strokeWidth: 2, strokeOpacity: 0.9 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#00d4ff' }
        }}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Controls 
          style={{
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '8px'
          }}
        />
        <MiniMap 
          style={{
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '8px'
          }}
          nodeColor={(node) => {
            const level = node.data?.level || 1;
            const colors = ['#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#9013FE', '#00BCD4'];
            return colors[(level - 1) % colors.length] || '#666';
          }}
        />
        <Background color="#fff" gap={16} size={1} style={{ opacity: 0.3 }} />
      </ReactFlow>
    </div>
  );
};

const MindMap = ({ mindmapData = [], loading = false, language = 'zh' }) => {
  if (!mindmapData || mindmapData.length === 0) {
    return (
      <Card 
        size="small"
        style={{ 
          minHeight: '300px',
          background: 'var(--theme-surface, rgba(255,255,255,0.8))',
          border: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
          borderRadius: '12px'
        }}
      >
        <Space direction="vertical" align="center" style={{ width: '100%', padding: '40px' }}>
          <BranchesOutlined style={{ fontSize: '48px', color: '#ccc' }} />
          <Text type="secondary">
            {language === 'zh' ? '暂无思维导图数据' : 'No mind map data available'}
          </Text>
        </Space>
      </Card>
    );
  }

  return (
    <Card 
      size="small"
      title={
        <Space>
          <BranchesOutlined style={{ color: 'var(--theme-primary, #007aff)' }} />
          <Title level={5} style={{ margin: 0, color: 'var(--theme-text)' }}>
            {language === 'zh' ? '智能思维导图' : 'Interactive Mind Map'}
          </Title>
          <Text type="secondary">({mindmapData.length} {language === 'zh' ? '节点' : 'nodes'})</Text>
        </Space>
      }
      loading={loading}
      style={{ 
        background: 'var(--theme-surface, rgba(255,255,255,0.8))',
        border: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
      styles={{
        header: { 
          borderBottom: '1px solid var(--theme-border, rgba(0,0,0,0.06))',
          padding: '12px 16px'
        },
        body: { padding: '0' }
      }}
      extra={
        <Text style={{ fontSize: '12px', color: 'var(--theme-textSecondary)' }}>
          {language === 'zh' ? '可拖拽、缩放、展开折叠、全屏查看' : 'Draggable, zoomable, expandable, fullscreen view'}
        </Text>
      }
    >
      <ModernMindMap nodes={mindmapData} language={language} />
    </Card>
  );
};

export default MindMap;