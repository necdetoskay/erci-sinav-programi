"use client";

import { Button } from "@/components/ui/button";
import { useLoadingControl } from "@/hooks/use-loading";

export const LoadingExample = () => {
  const { showLoading, hideLoading } = useLoadingControl();

  const simulateLoading = () => {
    showLoading();
    // 3 saniye sonra yükleme ekranını gizle
    setTimeout(() => {
      hideLoading();
    }, 3000);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold">Yükleme Ekranı Örneği</h2>
      <p className="text-muted-foreground">
        Bu butona tıklayarak manuel olarak yükleme ekranını gösterebilirsiniz.
      </p>
      <Button onClick={simulateLoading}>
        Yükleme Ekranını Göster (3 saniye)
      </Button>
    </div>
  );
};
