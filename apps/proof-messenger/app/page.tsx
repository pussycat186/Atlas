import Link from 'next/link';
import { SecurityBadge } from './(ui)/SecurityBadge';

// Force dynamic rendering - disable static generation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Atlas Messenger
            </h1>
            <p className="text-2xl sm:text-3xl font-semibold text-blue-600 dark:text-blue-400">
              Nhắn tin. An toàn. Tự kiểm chứng.
            </p>
          </div>

          {/* Security Badge */}
          <div className="flex justify-center mb-12">
            <SecurityBadge e2ee={true} bound={true} pqcPercentage={1} />
          </div>

          {/* Value Proposition */}
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Mọi tin nhắn được mã hóa đầu cuối và có bằng chứng mật mã. 
            Bạn có thể tự kiểm tra tính toàn vẹn của mọi cuộc trò chuyện.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              🔐 Dùng Passkey
            </Link>
            <Link
              href="/verify"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white dark:bg-slate-800 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              ✅ Xem xác minh
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Feature 1: E2EE */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Mã hóa E2EE
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Mọi tin nhắn được mã hóa đầu cuối. Chỉ bạn và người nhận mới đọc được.
              </p>
            </div>

            {/* Feature 2: Receipts */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">📜</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Biên nhận RFC 9421
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Mỗi tin nhắn có chữ ký mật mã. Tự kiểm tra bất cứ lúc nào.
              </p>
            </div>

            {/* Feature 3: PQC */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Sẵn sàng PQC
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Mật mã hóa chống máy tính lượng tử (ML-KEM-768) đã sẵn sàng.
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="flex items-start gap-4 text-left">
              <div className="text-2xl">✨</div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Không cần mật khẩu
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Đăng nhập bằng Passkey (Face ID, Touch ID, hoặc PIN)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left">
              <div className="text-2xl">🔍</div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Xác minh công khai
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bất kỳ ai cũng có thể kiểm tra biên nhận tại /verify
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left">
              <div className="text-2xl">🌐</div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Tiếng Việt ưu tiên
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Giao diện được thiết kế cho người dùng Việt Nam
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left">
              <div className="text-2xl">📱</div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Dễ tiếp cận
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Chế độ chữ lớn, điều hướng bàn phím, tương phản cao
                </p>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-20 pt-12 border-t border-gray-200 dark:border-slate-700">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              Sẵn sàng bắt đầu?
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg hover:shadow-xl"
            >
              Bắt đầu ngay →
            </Link>
          </div>

          {/* Security Note */}
          <div className="mt-12 text-sm text-gray-500 dark:text-gray-500">
            <p>
              🔒 Tất cả dữ liệu được mã hóa đầu cuối. Atlas không thể đọc tin nhắn của bạn.
            </p>
            <p className="mt-2">
              <Link href="/verify" className="underline hover:text-blue-600">
                Xem cách xác minh biên nhận
              </Link>
              {' • '}
              <Link href="/security" className="underline hover:text-blue-600">
                Tùy chọn bảo mật
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
