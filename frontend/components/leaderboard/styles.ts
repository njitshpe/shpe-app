import { StyleSheet } from 'react-native';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/colors';

export const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  atmosphericBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
  },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  profileBannerContent: {
    flex: 1,
  },
  profileBannerTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileBannerSubtitle: {
    ...TYPOGRAPHY.caption,
  },
  loadingContainer: {
    padding: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  heroBackdrop: {
    marginHorizontal: SPACING.md,
    marginTop: -55,
    marginBottom: 0,
  },
  podiumHeroContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 0,
    paddingTop: SPACING.xl * 2,
    paddingBottom: 0,
    paddingHorizontal: SPACING.sm,
  },
  podiumSlotSide: {
    flex: 1,
  },
  podiumSlotSecond: {
    marginTop: 70,
  },
  podiumSlotThird: {
    marginTop: 90,
  },
  podiumSlotCenter: {
    flex: 1.1,
  },
  yourRankChip: {
    position: 'absolute',
    bottom: SPACING.xl,
    alignSelf: 'center',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  yourRankChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  yourRankChipText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
  },
});
