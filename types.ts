export interface Choice {
  id: string;
  label: string;
  targetPageId: string | null;
  color?: 'primary' | 'secondary' | 'danger' | 'success'; // UI hint
}

export interface Page {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  choices: Choice[];
  isEndNode?: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  pages: Page[];
  startPageId: string | null;
  createdAt: number;
  isPublished?: boolean;
}

export interface UserProgress {
  userName: string;
  currentScenarioId: string;
  currentPageId: string;
  history: string[]; // List of page IDs visited
}

export interface JourneyStep {
  pageTitle: string;
  choiceLabel?: string;
}
