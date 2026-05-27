import React from "react";
import { ScrollView, View, StyleSheet, DimensionValue } from "react-native";
import {
  Skeleton,
  SkeletonItem,
  SkeletonCard,
} from "@components/common/Skeleton";

// Tỉ lệ chiều rộng cho nickname/fullName mỗi item — tránh đều răm rắp,
// tạo cảm giác organic giống dữ liệu thật.
const VARIATIONS: {
  nickname: DimensionValue;
  fullName: DimensionValue;
  badges: number;
}[] = [
  { nickname: "62%", fullName: "44%", badges: 2 },
  { nickname: "74%", fullName: "38%", badges: 2 },
  { nickname: "55%", fullName: "50%", badges: 1 },
  { nickname: "68%", fullName: "42%", badges: 2 },
  { nickname: "58%", fullName: "36%", badges: 1 },
  { nickname: "72%", fullName: "46%", badges: 2 },
];

export function StudentListSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.list}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    >
      <Skeleton>
        {VARIATIONS.map((v, idx) => (
          <SkeletonCard key={idx} style={styles.cardSpacing}>
            <View style={styles.row}>
              {/* Avatar 52px với viền 2px → tổng 56px */}
              <SkeletonItem width={56} height={56} borderRadius={28} />

              {/* Info block */}
              <View style={styles.info}>
                {/* Nickname */}
                <SkeletonItem
                  width={v.nickname}
                  height={15}
                  borderRadius={4}
                />
                {/* Full name */}
                <SkeletonItem
                  width={v.fullName}
                  height={11}
                  borderRadius={4}
                  marginTop={6}
                />
                {/* Badges row */}
                <View style={styles.badges}>
                  <SkeletonItem width={52} height={18} borderRadius={5} />
                  {v.badges === 2 && (
                    <SkeletonItem width={72} height={18} borderRadius={5} />
                  )}
                </View>
              </View>

              {/* Chevron */}
              <SkeletonItem width={6} height={12} borderRadius={2} />
            </View>
          </SkeletonCard>
        ))}
      </Skeleton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  cardSpacing: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 0,
  },
  badges: {
    flexDirection: "row",
    gap: 5,
    marginTop: 8,
  },
});
