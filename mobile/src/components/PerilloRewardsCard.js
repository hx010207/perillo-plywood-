import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, Dimensions } from 'react-native';

const CARD_TEXTURES = {
  Member: require('../assets/cards/card-tier-member.png'),
  Bronze: require('../assets/cards/card-tier-bronze.png'),
  Silver: require('../assets/cards/card-tier-silver.png'),
  Gold: require('../assets/cards/card-tier-bronze.png'),
  Platinum: require('../assets/cards/card-tier-pro.png'),
  Pro: require('../assets/cards/card-tier-pro.png'),
};

const TIER_LABELS = {
  Member: { label: 'MEMBER', pillBg: 'rgba(0,0,0,0.5)', pillBorder: '#10B981' },
  Bronze: { label: 'BRONZE', pillBg: 'rgba(0,0,0,0.5)', pillBorder: '#F59E0B' },
  Silver: { label: 'SILVER', pillBg: 'rgba(0,0,0,0.5)', pillBorder: '#CBD5E1' },
  Gold: { label: 'GOLD', pillBg: 'rgba(0,0,0,0.5)', pillBorder: '#FBBF24' },
  Platinum: { label: 'PRO FLAGSHIP', pillBg: 'rgba(0,0,0,0.5)', pillBorder: '#D97706' },
  Pro: { label: 'PRO FLAGSHIP', pillBg: 'rgba(0,0,0,0.5)', pillBorder: '#D97706' },
};

export const PerilloRewardsCard = ({
  userName = 'RAJU CARPENTER',
  userId = 'P987654',
  pointsBalance = 0,
  tier = 'Member',
}) => {
  const texture = CARD_TEXTURES[tier] || CARD_TEXTURES.Member;
  const tierInfo = TIER_LABELS[tier] || TIER_LABELS.Member;

  const formatCardNumber = (id) => {
    const clean = String(id || 'P987654').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return `PERILLO • ${clean.slice(0, 4) || 'P987'} • ${clean.slice(4, 8) || '654'}`;
  };

  return (
    <View style={styles.cardWrapper}>
      <ImageBackground
        source={texture}
        style={styles.cardBackground}
        imageStyle={styles.cardImageStyle}
      >
        {/* Dark overlay for contrast */}
        <View style={styles.darkOverlay} />

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Top Row: Brand & Tier Pill */}
          <View style={styles.topRow}>
            <View style={styles.brandGroup}>
              <View style={styles.logoCircle}>
                <Image
                  source={{ uri: 'https://perilloplywood.in/wp-content/uploads/2025/06/cropped-footerlogo-270x270.jpg' }}
                  style={styles.brandLogo}
                />
              </View>
              <View>
                <Text style={styles.brandTitle}>PERILLO REWARDS</Text>
                <Text style={styles.brandSub}>Hubballi Manufacturing HQ</Text>
              </View>
            </View>

            <View style={[styles.tierPill, { borderColor: tierInfo.pillBorder }]}>
              <Text style={styles.tierPillText}>✨ {tierInfo.label}</Text>
            </View>
          </View>

          {/* Middle: Clean Left-Aligned Available Balance & Points */}
          <View style={styles.middleSection}>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsNumber}>{(pointsBalance || 0).toLocaleString()}</Text>
              <Text style={styles.pointsSuffix}> Pts</Text>
            </View>
            <Text style={styles.inrSubText}>
              ₹{(pointsBalance || 0).toLocaleString()} INR • 1 Pt = ₹1
            </Text>
          </View>

          {/* Bottom Row: Cardholder & Membership ID */}
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.footerLabel}>Cardholder</Text>
              <Text style={styles.footerName}>{userName || 'RAJU CARPENTER'}</Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerLabel}>Membership No</Text>
              <Text style={styles.footerId}>{formatCardNumber(userId)}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 420);
const CARD_HEIGHT = CARD_WIDTH * 0.63;

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 6,
  },
  cardBackground: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandSub: {
    color: '#6EE7B7',
    fontSize: 8.5,
    fontWeight: '700',
  },
  tierPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
  },
  tierPillText: {
    color: '#FDE047',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  middleSection: {
    paddingLeft: 8,
  },
  balanceLabel: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsNumber: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  pointsSuffix: {
    color: '#6EE7B7',
    fontSize: 18,
    fontWeight: '800',
  },
  inrSubText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 8,
  },
  footerLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 8.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footerName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 1,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerId: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
    fontFamily: 'monospace',
  },
});
