import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Skeleton, SkeletonItem } from "@components/common/Skeleton";

export function ReportListSkeleton() {
  return (
    <ScrollView contentContainerStyle={styles.list} scrollEnabled={false}>
      <Skeleton>
        {Array.from({ length: 5 }).map((_, idx) => (
          <SkeletonItem
            key={idx}
            padding={14}
            marginBottom={10}
            borderRadius={14}
            backgroundColor="rgba(0,0,0,0.04)"
          >
            <SkeletonItem
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <SkeletonItem width="55%" height={15} borderRadius={4} />
              <SkeletonItem width={60} height={20} borderRadius={10} />
            </SkeletonItem>
            <SkeletonItem
              marginTop={10}
              width={100}
              height={11}
              borderRadius={4}
            />
            <SkeletonItem
              marginTop={6}
              width="85%"
              height={11}
              borderRadius={4}
            />
          </SkeletonItem>
        ))}
      </Skeleton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
});
