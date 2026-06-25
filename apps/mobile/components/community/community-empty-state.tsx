import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/use-app-theme';
import type { CommunityScope } from '../../lib/api/community';
import { EmptyState } from '../empty-state';

type Props = {
  scope: CommunityScope;
  examName: string;
  onCreatePost: () => void;
};

const COPY: Record<
  CommunityScope,
  { title: string; description: (examName: string) => string; showAction: boolean }
> = {
  all: {
    title: 'No posts yet',
    description: (examName) => `Be the first to ask a question or share a review tip with ${examName} reviewers.`,
    showAction: true,
  },
  mine: {
    title: "You haven't posted yet",
    description: () => 'Share a question or tip with the community.',
    showAction: true,
  },
  saved: {
    title: 'No saved posts yet',
    description: () => 'Tap the bookmark icon on a post to save it for later.',
    showAction: false,
  },
};

export function CommunityEmptyState({ scope, examName, onCreatePost }: Props) {
  const { colors } = useAppTheme();
  const copy = COPY[scope];

  return (
    <EmptyState
      icon={<Ionicons name="people-outline" size={32} color={colors.primary} />}
      title={copy.title}
      description={copy.description(examName)}
      actionLabel={copy.showAction ? 'Create Post' : undefined}
      onAction={copy.showAction ? onCreatePost : undefined}
    />
  );
}
