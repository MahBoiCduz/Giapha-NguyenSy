import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GitBranch, Users, Search, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Dành cho dòng họ Việt Nam
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Cây Gia Phả{" "}
              <span className="text-primary">Số Hóa</span> Cho Dòng Họ
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Xây dựng cây phả đồ tương tác, lưu giữ lịch sử dòng họ và kết nối
              các thế hệ. Dễ dàng chia sẻ và khám phá mối quan hệ trong gia đình.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                <GitBranch className="h-5 w-5" />
                Tạo Phả Đồ Miễn Phí
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="outline" size="lg">
                Đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tính năng chính
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<GitBranch className="h-8 w-8" />}
              title="Phả đồ tương tác"
              description="Xem và tương tác với cây gia phả trực quan. Zoom, kéo thả, tìm kiếm dễ dàng."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Hồ sơ thành viên"
              description="Lưu trữ thông tin chi tiết từng thành viên: ảnh, ngày sinh, tiểu sử, học vấn..."
            />
            <FeatureCard
              icon={<Search className="h-8 w-8" />}
              title="Tìm quan hệ"
              description="Tìm đường dẫn quan hệ giữa 2 người bất kỳ trong dòng họ."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Bảo mật"
              description="Kiểm soát quyền xem phả đồ bằng mã bảo mật. Chỉ chia sẻ với người bạn muốn."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <p>Gia Phả — Ứng dụng quản lý cây gia phả dòng họ Việt Nam</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
