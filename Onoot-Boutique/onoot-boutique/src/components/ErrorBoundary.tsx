import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-border">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oups, une erreur est survenue</h1>
            <p className="text-gray-600 mb-6">
              Nous sommes désolés, une erreur inattendue s'est produite lors de l'affichage de cette page.
            </p>
            {this.state.error && (
              <div className="bg-red-50 text-red-800 p-4 rounded text-left text-sm mb-6 overflow-auto max-h-40 break-words font-mono">
                <strong>Erreur:</strong> {this.state.error.toString()}
              </div>
            )}
            <Button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }} 
              className="w-full bg-primary hover:bg-primary/90"
            >
              Retourner à l'accueil
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
