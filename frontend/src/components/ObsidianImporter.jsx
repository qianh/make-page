import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Tree, 
  Typography, 
  Space, 
  message, 
  Spin, 
  Empty, 
  Divider,
  Checkbox,
  Row,
  Col,
  Badge
} from 'antd';
import { 
  FolderOutlined, 
  FileTextOutlined, 
  ImportOutlined, 
  FolderOpenOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const ObsidianImporter = ({ onImportFiles }) => {
  const [vaultPath, setVaultPath] = useState('/Users/john/private/md');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [vaultName, setVaultName] = useState('');

  const handleLoadVault = async () => {
    if (!vaultPath.trim()) {
      message.error('Please enter a valid vault path');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/obsidian/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault_path: vaultPath })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to load vault');
      }

      const data = await response.json();
      setFiles(data.files);
      setVaultName(data.vault_name);
      setSelectedFiles([]);
      message.success(`Loaded ${data.files.filter(f => !f.is_directory).length} files from ${data.vault_name}`);
    } catch (error) {
      console.error('Error loading vault:', error);
      message.error(`Failed to load vault: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = useCallback(() => {
    const tree = {};
    const filteredFiles = files.filter(file => 
      file.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      file.path.toLowerCase().includes(searchValue.toLowerCase())
    );

    filteredFiles.forEach(file => {
      const pathParts = file.path.split('/');
      let current = tree;
      
      pathParts.forEach((part, index) => {
        if (!current[part]) {
          const isLastPart = index === pathParts.length - 1;
          current[part] = {
            key: pathParts.slice(0, index + 1).join('/'),
            title: part,
            isDirectory: isLastPart ? file.is_directory : true,
            fileData: isLastPart ? file : null,
            children: {}
          };
        }
        current = current[part].children;
      });
    });

    const convertToAntTreeFormat = (obj) => {
      return Object.values(obj).map(node => ({
        key: node.key,
        title: (
          <Space>
            {node.isDirectory ? <FolderOutlined /> : <FileTextOutlined />}
            <Text>{node.title}</Text>
            {!node.isDirectory && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ({Math.round(node.fileData.size / 1024)}KB)
              </Text>
            )}
            {!node.isDirectory && selectedFiles.includes(node.key) && (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            )}
          </Space>
        ),
        children: Object.keys(node.children).length > 0 ? convertToAntTreeFormat(node.children) : undefined,
        isLeaf: !node.isDirectory,
        fileData: node.fileData
      }));
    };

    return convertToAntTreeFormat(tree);
  }, [files, searchValue, selectedFiles]);

  const handleFileSelect = (selectedKeys) => {
    const leafKeys = selectedKeys.filter(key => {
      const file = files.find(f => f.path === key);
      return file && !file.is_directory;
    });
    setSelectedFiles(leafKeys);
  };

  const handleImport = () => {
    const selectedFileData = files.filter(file => 
      selectedFiles.includes(file.path) && !file.is_directory
    );
    
    if (selectedFileData.length === 0) {
      message.error('Please select at least one file to import');
      return;
    }

    onImportFiles(selectedFileData);
    message.success(`Imported ${selectedFileData.length} files`);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allFileKeys = files.filter(f => !f.is_directory).map(f => f.path);
      setSelectedFiles(allFileKeys);
    } else {
      setSelectedFiles([]);
    }
  };

  const treeData = buildTreeData();
  const selectedCount = selectedFiles.length;
  const totalFiles = files.filter(f => !f.is_directory).length;

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Enter Obsidian vault path (e.g., /Users/username/Documents/MyVault)"
              value={vaultPath}
              onChange={(e) => setVaultPath(e.target.value)}
              onPressEnter={handleLoadVault}
            />
          </Col>
          <Col>
            <Button 
              type="primary" 
              onClick={handleLoadVault}
              loading={loading}
              icon={<FolderOpenOutlined />}
            >
              Load Vault
            </Button>
          </Col>
        </Row>

        {vaultName && (
          <div>
            <Text strong>Vault: </Text>
            <Text>{vaultName}</Text>
            <Divider style={{ margin: '12px 0' }} />
          </div>
        )}

        {files.length > 0 && (
          <>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Checkbox 
                    checked={selectedCount === totalFiles && totalFiles > 0}
                    indeterminate={selectedCount > 0 && selectedCount < totalFiles}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  >
                    Select All
                  </Checkbox>
                  <Badge count={selectedCount} style={{ backgroundColor: '#52c41a' }}>
                    <Text>Selected Files</Text>
                  </Badge>
                </Space>
              </Col>
              <Col>
                <Button 
                  type="primary" 
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  icon={<ImportOutlined />}
                >
                  Import Selected ({selectedCount})
                </Button>
              </Col>
            </Row>

            <Search
              placeholder="Search files..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '6px', padding: '8px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                  <Paragraph style={{ marginTop: 16 }}>Loading vault files...</Paragraph>
                </div>
              ) : treeData.length > 0 ? (
                <Tree
                  checkable
                  checkedKeys={selectedFiles}
                  onCheck={handleFileSelect}
                  expandedKeys={expandedKeys}
                  onExpand={setExpandedKeys}
                  treeData={treeData}
                  height={350}
                />
              ) : (
                <Empty description="No files found" />
              )}
            </div>
          </>
        )}
      </Space>
    </div>
  );
};

export default ObsidianImporter;