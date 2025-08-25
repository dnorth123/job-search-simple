import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ExternalLink, 
  X, 
  Globe, 
  BarChart3, 
  Palette, 
  Lightbulb, 
  Zap, 
  Crown,
  Award,
  Users
} from 'lucide-react';
import { 
  JOB_BOARDS, 
  JOB_BOARD_CATEGORIES, 
  getJobBoardsByCategory, 
  searchJobBoards,
  getJobBoardStats,
  type JobBoard, 
  type JobBoardCategory 
} from '../data/jobBoardsData';

interface JobBoardMatrixProps {
  onClose: () => void;
}

export const JobBoardMatrix: React.FC<JobBoardMatrixProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<JobBoardCategory | 'all'>('all');

  const stats = useMemo(() => getJobBoardStats(), []);

  const filteredBoards = useMemo(() => {
    let boards = JOB_BOARDS;
    
    if (selectedCategory !== 'all') {
      boards = getJobBoardsByCategory(selectedCategory);
    }
    
    if (searchTerm.trim()) {
      boards = searchJobBoards(searchTerm).filter(board => 
        selectedCategory === 'all' || board.category === selectedCategory
      );
    }
    
    return boards;
  }, [searchTerm, selectedCategory]);

  const boardsByCategory = useMemo(() => {
    const grouped: Record<JobBoardCategory, JobBoard[]> = {
      general: [],
      product_management: [],
      ux_design: [],
      strategy_innovation: [],
      contract_fractional: [],
      executive_curated: []
    };

    filteredBoards.forEach(board => {
      grouped[board.category].push(board);
    });

    return grouped;
  }, [filteredBoards]);


  const handleExternalLink = (url: string, boardName: string) => {
    // Track analytics if available
    console.log(`Opening job board: ${boardName} - ${url}`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getCategoryIcon = (iconName: string) => {
    const iconProps = { size: 20, className: "text-current" };
    switch (iconName) {
      case 'Globe': return <Globe {...iconProps} />;
      case 'BarChart3': return <BarChart3 {...iconProps} />;
      case 'Palette': return <Palette {...iconProps} />;
      case 'Lightbulb': return <Lightbulb {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      case 'Crown': return <Crown {...iconProps} />;
      default: return <Globe {...iconProps} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-large max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="card-header sticky top-0 bg-white z-10 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-executive-primary">
                Job Board Matrix
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Comprehensive directory of {stats.total} professional job platforms
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost hover:bg-neutral-100"
              title="Close Job Board Matrix"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-neutral-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-executive-primary rounded-full"></div>
              <span>{stats.total} Total Platforms</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-intelligence-primary rounded-full"></div>
              <span>{stats.premium} Premium Services</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
              <span>{stats.applicationRequired} Application Required</span>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search job boards by name, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input w-full text-sm pl-10"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as JobBoardCategory | 'all')}
                className="form-select w-full text-sm"
              >
                <option value="all">All Categories ({stats.total})</option>
                {Object.entries(JOB_BOARD_CATEGORIES).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.label} ({stats.byCategory[key as JobBoardCategory]})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {selectedCategory === 'all' ? (
            // Show all categories
            <div className="space-y-8 p-6">
              {Object.entries(JOB_BOARD_CATEGORIES).map(([categoryKey, categoryInfo]) => {
                const categoryBoards = boardsByCategory[categoryKey as JobBoardCategory];
                if (categoryBoards.length === 0) return null;

                return (
                  <div key={categoryKey} className="space-y-4">
                    <div className="border-b border-neutral-200 pb-3">
                      <h3 className="text-lg font-semibold text-neutral-900 flex items-center space-x-2">
                        {getCategoryIcon(categoryInfo.iconName)}
                        <span>{categoryInfo.label}</span>
                        <span className="text-sm font-normal text-neutral-500">
                          ({categoryBoards.length})
                        </span>
                      </h3>
                      <p className="text-sm text-neutral-600 mt-1">
                        {categoryInfo.description}
                      </p>
                    </div>
                    <JobBoardGrid 
                      boards={categoryBoards}
                      onOpenLink={handleExternalLink}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // Show single category
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-neutral-900 flex items-center space-x-2">
                  {getCategoryIcon(JOB_BOARD_CATEGORIES[selectedCategory].iconName)}
                  <span>{JOB_BOARD_CATEGORIES[selectedCategory].label}</span>
                  <span className="text-sm font-normal text-neutral-500">
                    ({filteredBoards.length})
                  </span>
                </h3>
                <p className="text-neutral-600 mt-1">
                  {JOB_BOARD_CATEGORIES[selectedCategory].description}
                </p>
              </div>
              <JobBoardGrid 
                boards={filteredBoards}
                onOpenLink={handleExternalLink}
              />
            </div>
          )}

          {/* No Results State */}
          {filteredBoards.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
              <div className="mb-4">
                <Search size={48} className="text-neutral-300" />
              </div>
              <h3 className="text-lg font-medium mb-2">No job boards found</h3>
              <p className="text-sm text-center max-w-md">
                Try adjusting your search terms or category filter to find relevant job boards.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="btn btn-secondary mt-4 text-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface JobBoardGridProps {
  boards: JobBoard[];
  onOpenLink: (url: string, boardName: string) => void;
}

const JobBoardGrid: React.FC<JobBoardGridProps> = ({
  boards,
  onOpenLink
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => {

        return (
          <div key={board.name} className="card hover:shadow-medium transition-shadow duration-200 flex flex-col h-full">
            <div className="card-body flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-neutral-900">{board.name}</h4>
                    {board.isPremium && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-intelligence-lighter text-intelligence-primary">
                        Premium
                      </span>
                    )}
                    {board.requiresApplication && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-lighter text-accent-primary">
                        Apply
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex-1 mb-4">
                <p className="text-sm text-neutral-600 mb-3 leading-relaxed">
                  {board.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {board.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600"
                    >
                      {tag}
                    </span>
                  ))}
                  {board.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
                      +{board.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onOpenLink(board.url, board.name)}
                className="btn btn-primary w-full text-sm flex items-center justify-center space-x-2"
              >
                <span>Visit Platform</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};