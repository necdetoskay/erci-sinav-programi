"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}: PaginationProps) {
  // Sayfa numaralarını oluştur
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Toplam sayfa sayısı maxVisiblePages'den az ise tüm sayfaları göster
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // İlk ve son sayfaları her zaman göster, ortada maxVisiblePages-2 sayfa göster
    const halfVisiblePages = Math.floor((maxVisiblePages - 2) / 2);
    
    // İlk sayfaları göster
    if (currentPage <= halfVisiblePages + 1) {
      for (let i = 1; i <= maxVisiblePages - 1; i++) {
        pageNumbers.push(i);
      }
      pageNumbers.push("ellipsis");
      pageNumbers.push(totalPages);
      return pageNumbers;
    }
    
    // Son sayfaları göster
    if (currentPage >= totalPages - halfVisiblePages) {
      pageNumbers.push(1);
      pageNumbers.push("ellipsis");
      for (let i = totalPages - (maxVisiblePages - 2); i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // Ortadaki sayfaları göster
    pageNumbers.push(1);
    pageNumbers.push("ellipsis");
    for (let i = currentPage - halfVisiblePages; i <= currentPage + halfVisiblePages; i++) {
      pageNumbers.push(i);
    }
    pageNumbers.push("ellipsis");
    pageNumbers.push(totalPages);
    
    return pageNumbers;
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Önceki Sayfa</span>
      </Button>
      
      {getPageNumbers().map((page, index) => {
        if (page === "ellipsis") {
          return (
            <Button
              key={`ellipsis-${index}`}
              variant="ghost"
              size="icon"
              disabled
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Daha Fazla Sayfa</span>
            </Button>
          );
        }
        
        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page as number)}
          >
            {page}
            <span className="sr-only">{page}. Sayfa</span>
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Sonraki Sayfa</span>
      </Button>
    </div>
  );
}
