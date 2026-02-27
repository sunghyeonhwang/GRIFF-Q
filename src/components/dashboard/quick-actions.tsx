import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Calculator, CreditCard, Plus } from "lucide-react";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/meetings/new">
        <Button variant="outline" size="sm">
          <FileText className="mr-1.5 size-3.5" />
          새 회의록
        </Button>
      </Link>
      <Link href="/estimates/new">
        <Button variant="outline" size="sm">
          <Calculator className="mr-1.5 size-3.5" />
          새 견적서
        </Button>
      </Link>
      <Link href="/payments/new">
        <Button variant="outline" size="sm">
          <CreditCard className="mr-1.5 size-3.5" />
          입금 등록
        </Button>
      </Link>
      <Link href="/retrospective/new">
        <Button variant="outline" size="sm">
          <Plus className="mr-1.5 size-3.5" />
          회고 작성
        </Button>
      </Link>
    </div>
  );
}
