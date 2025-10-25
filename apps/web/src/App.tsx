import React from "react";
import { Switch, Route } from "wouter";
import { Web3Provider } from "@/providers/Web3Provider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/index";
import NotFound from "@/pages/not-found";
import WalletDemo from "@/pages/wallet-demo";
import IdRefactorDemo from "@/pages/id-refactor-demo";
import InvitePage from "@/pages/invite";
import InviteTokenPage from "@/pages/invite/[token]";
import ShareableKeyInvitePage from "@/pages/invite/shareable/[token]";
import CollectionInvitePage from "@/app/invite/collection/[collectionId]/page";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/wallet-demo" component={WalletDemo} />
      <Route path="/id-refactor-demo" component={IdRefactorDemo} />
      <Route path="/invite" component={InvitePage} />
      <Route path="/invite/collection/:collectionId" component={CollectionInvitePage} />
      <Route path="/invite/shareable/:token" component={ShareableKeyInvitePage} />
      <Route path="/invite/:token" component={InviteTokenPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
