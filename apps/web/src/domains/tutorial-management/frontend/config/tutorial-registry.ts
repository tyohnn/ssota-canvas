import type {
  Tutorial,
  TutorialGroup,
} from '@/domains/tutorial-management/shared/types/tutorial.types';

/**
 * Tutorial Registry
 *
 * Central registry for all tutorials in the application
 */
class TutorialRegistry {
  private tutorials: Map<string, Tutorial> = new Map();

  /**
   * Register a tutorial
   */
  register(tutorial: Tutorial): void {
    this.tutorials.set(tutorial.id, tutorial);
  }

  /**
   * Register multiple tutorials
   */
  registerMany(tutorials: Tutorial[]): void {
    tutorials.forEach((tutorial) => this.register(tutorial));
  }

  /**
   * Get tutorial by ID
   */
  getTutorialById(id: string): Tutorial | undefined {
    return this.tutorials.get(id);
  }

  /**
   * Get all tutorials
   */
  getAllTutorials(): Tutorial[] {
    return Array.from(this.tutorials.values());
  }

  /**
   * Get tutorials by category
   */
  getTutorialsByCategory(category: string): Tutorial[] {
    return this.getAllTutorials().filter((t) => t.category === category);
  }

  /**
   * Get tutorial groups for navigation
   */
  getTutorialGroups(): TutorialGroup[] {
    const groups: TutorialGroup[] = [
      {
        id: 'getting-started',
        name: 'Getting Started',
        category: 'getting-started',
        tutorials: this.getTutorialsByCategory('getting-started'),
      },
      {
        id: 'blocks',
        name: 'Meet the Blocks',
        category: 'blocks',
        tutorials: this.getTutorialsByCategory('blocks'),
      },
      {
        id: 'block-advance',
        name: 'Block advance',
        category: 'block-advance',
        tutorials: this.getTutorialsByCategory('block-advance'),
      },
      {
        id: 'edges',
        name: 'Meet the Edges',
        category: 'edges',
        tutorials: this.getTutorialsByCategory('edges'),
      },
      {
        id: 'ai',
        name: 'Meet SSOTA AI',
        category: 'ai',
        tutorials: this.getTutorialsByCategory('ai'),
      },
      {
        id: 'editor-panel',
        name: 'Meet the Editor Panel',
        category: 'editor-panel',
        tutorials: this.getTutorialsByCategory('editor-panel'),
      },
      {
        id: 'database',
        name: 'Meet the Database',
        category: 'database',
        tutorials: this.getTutorialsByCategory('database'),
      },
      {
        id: 'sub-agents',
        name: 'Meet the Sub Agents',
        category: 'sub-agents',
        tutorials: this.getTutorialsByCategory('sub-agents'),
      },
    ];

    return groups.filter((group) => group.tutorials.length > 0);
  }
}

// Create singleton instance
export const tutorialRegistry = new TutorialRegistry();

// Import and register tutorials
import {
  gettingStartedTutorial,
  youtubeBlockTutorial,
  markdownBlockTutorial,
  linkBlockTutorial,
  addBlockMethodTutorial,
  duplicateBlockTutorial,
  groupBlocksTutorial,
  deleteBlocksTutorial,
  edgesTutorial,
  basicEditorPanelTutorial,
  addCustomPropertyTutorial,
  addViewsTutorial,
  createSubAgentTutorial,
  createSkillsTutorial,
} from './tutorials';

tutorialRegistry.registerMany([
  gettingStartedTutorial,
  youtubeBlockTutorial,
  markdownBlockTutorial,
  linkBlockTutorial,
  addBlockMethodTutorial,
  duplicateBlockTutorial,
  groupBlocksTutorial,
  deleteBlocksTutorial,
  edgesTutorial,
  basicEditorPanelTutorial,
  addCustomPropertyTutorial,
  addViewsTutorial,
  createSubAgentTutorial,
  createSkillsTutorial,
]);
