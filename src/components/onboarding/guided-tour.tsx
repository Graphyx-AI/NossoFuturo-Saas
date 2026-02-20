"use client";

import { useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

const TOUR_STORAGE_KEY = "nf_tour_pending";

type TourMessages = {
  sidebarTitle: string;
  sidebarDesc: string;
  transactionsTitle: string;
  transactionsDesc: string;
  investmentsTitle: string;
  investmentsDesc: string;
  goalsTitle: string;
  goalsDesc: string;
  yearViewTitle: string;
  yearViewDesc: string;
  workspaceTitle: string;
  workspaceDesc: string;
  settingsTitle: string;
  settingsDesc: string;
  next: string;
  prev: string;
  done: string;
  gotIt: string;
  progress: string;
};

function buildTourSteps(t: TourMessages): DriveStep[] {
  return [
    {
      element: "[data-tour='sidebar']",
      popover: { title: t.sidebarTitle, description: t.sidebarDesc, side: "right", align: "start" },
    },
    {
      element: "[data-tour='nav-transactions']",
      popover: { title: t.transactionsTitle, description: t.transactionsDesc, side: "right", align: "start" },
    },
    {
      element: "[data-tour='nav-investments']",
      popover: { title: t.investmentsTitle, description: t.investmentsDesc, side: "right", align: "start" },
    },
    {
      element: "[data-tour='nav-goals']",
      popover: { title: t.goalsTitle, description: t.goalsDesc, side: "right", align: "start" },
    },
    {
      element: "[data-tour='dashboard-content']",
      popover: { title: t.yearViewTitle, description: t.yearViewDesc, side: "left", align: "start" },
    },
    {
      element: "[data-tour='header-workspace']",
      popover: { title: t.workspaceTitle, description: t.workspaceDesc, side: "bottom", align: "start" },
    },
    {
      element: "[data-tour='nav-settings']",
      popover: {
        title: t.settingsTitle,
        description: t.settingsDesc,
        side: "right",
        align: "start",
        doneBtnText: t.gotIt,
      },
    },
  ];
}

function filterStepsByExistingElements(steps: DriveStep[]) {
  return steps.filter((step) => {
    if (!step.element || typeof step.element !== "string") return false;
    return !!document.querySelector(step.element);
  });
}

function isDashboardOverviewPath(pathname: string) {
  const clean = pathname.split("?")[0];
  return /\/(pt-BR|pt-PT|en|es)\/dashboard$/.test(clean);
}

function getLocalePrefix(pathname: string) {
  const first = pathname.split("/").filter(Boolean)[0];
  const locales = new Set(["pt-BR", "pt-PT", "en", "es"]);
  return locales.has(first) ? `/${first}` : "/pt-BR";
}

export function startGuidedTour(messages: TourMessages) {
  if (typeof window === "undefined") return;

  const pathname = window.location.pathname;
  if (!isDashboardOverviewPath(pathname)) {
    sessionStorage.setItem(TOUR_STORAGE_KEY, "1");
    window.location.href = `${getLocalePrefix(pathname)}/dashboard`;
    return;
  }

  const filteredSteps = filterStepsByExistingElements(buildTourSteps(messages));
  if (filteredSteps.length === 0) {
    sessionStorage.removeItem(TOUR_STORAGE_KEY);
    return;
  }

  const driverObj = driver({
    showProgress: true,
    allowClose: true,
    steps: filteredSteps,
    nextBtnText: messages.next,
    prevBtnText: messages.prev,
    doneBtnText: messages.done,
    progressText: messages.progress,
    onDestroyStarted: () => sessionStorage.removeItem(TOUR_STORAGE_KEY),
    onCloseClick: (_el, _step, { driver }) => {
      sessionStorage.removeItem(TOUR_STORAGE_KEY);
      driver.destroy();
    },
  });
  driverObj.drive();
}

export function useGuidedTour() {
  const t = useTranslations("tour");
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isDashboardOverviewPath(pathname)) return;

    const pending = sessionStorage.getItem(TOUR_STORAGE_KEY);
    if (pending === "1") {
      sessionStorage.removeItem(TOUR_STORAGE_KEY);
      const messages: TourMessages = {
        sidebarTitle: t("sidebarTitle"),
        sidebarDesc: t("sidebarDesc"),
        transactionsTitle: t("transactionsTitle"),
        transactionsDesc: t("transactionsDesc"),
        investmentsTitle: t("investmentsTitle"),
        investmentsDesc: t("investmentsDesc"),
        goalsTitle: t("goalsTitle"),
        goalsDesc: t("goalsDesc"),
        yearViewTitle: t("yearViewTitle"),
        yearViewDesc: t("yearViewDesc"),
        workspaceTitle: t("workspaceTitle"),
        workspaceDesc: t("workspaceDesc"),
        settingsTitle: t("settingsTitle"),
        settingsDesc: t("settingsDesc"),
        next: t("next"),
        prev: t("prev"),
        done: t("done"),
        gotIt: t("gotIt"),
        progress: t("progress"),
      };
      setTimeout(() => startGuidedTour(messages), 400);
    }
  }, [pathname, t]);
}

export function setTourPending() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(TOUR_STORAGE_KEY, "1");
  }
}
