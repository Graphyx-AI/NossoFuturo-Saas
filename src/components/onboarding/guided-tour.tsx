"use client";

import { useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_STORAGE_KEY = "nf_tour_pending";

const TOUR_STEPS: DriveStep[] = [
      {
        element: "[data-tour='sidebar']",
        popover: {
          title: "Menu lateral",
          description:
            "Use o menu à esquerda para navegar. Aqui você acessa todas as áreas do app: transações, investimentos, metas e mais.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "[data-tour='nav-transactions']",
        popover: {
          title: "Transações",
          description:
            "Clique aqui para registrar receitas e despesas. É por aqui que você começa a controlar seu fluxo de caixa.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "[data-tour='nav-investments']",
        popover: {
          title: "Investimentos",
          description: "Cadastre suas aplicações e acompanhe a evolução do patrimônio.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "[data-tour='nav-goals']",
        popover: {
          title: "Metas financeiras",
          description:
            "Defina objetivos como viagem ou reserva de emergência e acompanhe o progresso.",
          side: "right",
          align: "start",
        },
      },
      {
        element: "[data-tour='dashboard-content']",
        popover: {
          title: "Visão do ano",
          description:
            "Aqui você vê o saldo de cada mês. Clique em um mês para ver as transações e adicionar receitas ou despesas.",
          side: "left",
          align: "start",
        },
      },
      {
        element: "[data-tour='header-workspace']",
        popover: {
          title: "Seu workspace",
          description:
            "O nome do seu espaço de finanças. Quando tiver mais de um (ex: pessoal e empresa), troque aqui.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "[data-tour='nav-settings']",
        popover: {
          title: "Configurações",
          description:
            "Convide familiares, altere o plano e gerencie seu workspace. Comece por Transações para registrar sua primeira movimentação!",
          side: "right",
          align: "start",
          doneBtnText: "Entendi, vamos lá!",
          onNextClick: (_element, _step, { driver }) => {
            sessionStorage.removeItem(TOUR_STORAGE_KEY);
            driver.destroy();
          },
          onCloseClick: (_element, _step, { driver }) => {
            sessionStorage.removeItem(TOUR_STORAGE_KEY);
            driver.destroy();
          },
        },
      },
    ];

export function startGuidedTour() {
  if (typeof window === "undefined") return;
  const driverObj = driver({
    showProgress: true,
    allowClose: true,
    steps: TOUR_STEPS,
    nextBtnText: "Próximo",
    prevBtnText: "Voltar",
    doneBtnText: "Começar",
    progressText: "{{current}} de {{total}}",
    onDestroyStarted: () => {
      sessionStorage.removeItem(TOUR_STORAGE_KEY);
    },
    onCloseClick: (_el, _step, { driver }) => {
      sessionStorage.removeItem(TOUR_STORAGE_KEY);
      driver.destroy();
    },
  });
  driverObj.drive();
}

export function useGuidedTour() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = sessionStorage.getItem(TOUR_STORAGE_KEY);
    if (pending === "1") {
      sessionStorage.removeItem(TOUR_STORAGE_KEY);
      setTimeout(startGuidedTour, 500);
    }
  }, []);
}

export function setTourPending() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(TOUR_STORAGE_KEY, "1");
  }
}
