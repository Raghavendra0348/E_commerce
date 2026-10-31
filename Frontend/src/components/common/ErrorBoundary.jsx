import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg border border-gray-200 p-8 shadow-sm text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-[#FFF8E7] text-[#B7791F]">
              <AlertTriangle className="h-8 w-8 text-[#FF9900]" />
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[#0F1111]">
                Something went wrong
              </h1>
              <p className="text-xs text-[#565959] leading-relaxed">
                An unexpected application error occurred. We apologize for the inconvenience.
              </p>
            </div>

            {process.env.NODE_ENV !== "production" && this.state.error && (
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200 text-left overflow-x-auto max-h-32 text-[11px] font-mono text-[#CC0C39]">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
                className="text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try Again
              </Button>
              <Button
                size="sm"
                onClick={this.handleGoHome}
                className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs"
              >
                <Home className="h-3.5 w-3.5 mr-1.5" /> Go to Homepage
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
