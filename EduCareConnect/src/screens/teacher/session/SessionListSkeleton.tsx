import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Skeleton, SkeletonItem } from "@components/common/Skeleton";

const COUNT = 5;

export function SessionListSkeleton() {
  return (
    <ScrollView contentContainerStyle={styles.list} scrollEnabled={false}>
      <Skeleton>
        {Array.from({ length: COUNT }).map((_, idx) => (
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
              <SkeletonItem width={120} height={16} borderRadius={4} />
              <SkeletonItem width={60} height={20} borderRadius={10} />
            </SkeletonItem>
            <SkeletonItem
              marginTop={10}
              width="55%"
              height={14}
              borderRadius={4}
            />
            <SkeletonItem marginTop={8} flexDirection="row" alignItems="center">
              <SkeletonItem width={70} height={18} borderRadius={6} />
              <SkeletonItem
                marginLeft={6}
                width={70}
                height={18}
                borderRadius={6}
              />
            </SkeletonItem>
          </SkeletonItem>
        ))}
      </Skeleton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
});
