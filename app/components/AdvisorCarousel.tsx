"use client";
import React, { useEffect, useState } from "react";

const advisorData = [
  {
    college: "College of Natural Sciences",
    advisors: [
      { name: "Stephanie Kraft-Terry", email: "kraft2@hawaii.edu", phone: "808-956-0735" },
      { name: "Irisela Martinez", email: "irisela@hawaii.edu", phone: "808-956-0824" },
      { name: "Elerose Cordero", email: "elerose@hawaii.edu", phone: "808-956-5912" },
      { name: "Kamana Seymour", email: "kamanaok@hawaii.edu", phone: "808-956-0788" },
      { name: "Jordan E. Abanto", email: "abanto@hawaii.edu", phone: "808-956-6174" },
      { name: "Amanda Ponce", email: "aponce42@hawaii.edu", phone: "808-956-8996" },
      { name: "Kenny Kaʻaiakamanu-Quibilan", email: "kennydq@hawaii.edu", phone: "808-956-6695" },
      { name: "Quinn Goo", email: "qgoo@hawaii.edu", phone: "808-956-5912" },
      { name: "Max Lee", email: "maxl@hawaii.edu", phone: "808-956-3365" }
    ]
  },
  {
    college: "Shidler College of Business & School of Travel Industry Management",
    advisors: [
      { name: "General Office", email: "business@hawaii.edu", phone: "808-956-8215" },
      { name: "Clare Fujioka-Sok", email: "claref@hawaii.edu", phone: "808-956-8215" },
      { name: "Penny Ching", email: "pennylee@hawaii.edu", phone: "808-956-8215" },
      { name: "Mark Nakamoto", email: "mark.nakamoto@hawaii.edu", phone: "808-956-8215" },
      { name: "Kaitlin Nalani Tilitile", email: "tilitile@hawaii.edu", phone: "808-956-4887" }
    ]
  },
  {
    college: "Student-Athlete Academic Services (SAAS)",
    advisors: [
      { name: "Garrett Clanin", email: "garrettc@hawaii.edu", phone: "808-956-4526" },
      { name: "Kari Ambrozich", email: "kbanders@hawaii.edu", phone: "808-956-2441" },
      { name: "RJ Ozoa-Aglugub", email: "rjma@hawaii.edu", phone: "808-956-2672" },
      { name: "Kelsey O'Brien-Robinson", email: "kelsey42@hawaii.edu", phone: "808-956-9997" },
      { name: "Nicole Sagapolutele", email: "nicole78@hawaii.edu", phone: "808-956-6741" },
      { name: "Erika Huddle", email: "ehuddle@hawaii.edu", phone: "808-956-6697" },
      { name: "Aysia Amion", email: "aysiaa@hawaii.edu", phone: null }
    ]
  }
];

const CARD_FADE_DURATION = 1600; // ms
const CAROUSEL_INTERVAL = 10000; // ms

export default function AdvisorCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let fadeTimeoutId: NodeJS.Timeout;

    const startCarousel = () => {
      fadeTimeoutId = setTimeout(() => {
        setFade(true);
        timeoutId = setTimeout(() => {
          setActiveIndex((prev) => (prev + 1) % advisorData.length);
          setFade(false);
          startCarousel();
        }, CARD_FADE_DURATION);
      }, CAROUSEL_INTERVAL - CARD_FADE_DURATION);
    };
    startCarousel();
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(fadeTimeoutId);
    };
  }, []);

  const { college, advisors } = advisorData[activeIndex];

  return (
    <div className="advisor-carousel-container" style={{ background: "transparent", backdropFilter: "none" }}>
      <div className={`advisor-carousel ${fade ? "fade" : "show"} bg-transparent`}>
        <h2 className="college-title">{college}</h2>
        <div className="advisor-cards">
          {advisors.map((advisor, idx) => (
            <div className="advisor-card" key={advisor.email || advisor.name + idx}>
              <div className="advisor-name">{advisor.name}</div>
              <div className="advisor-email">{advisor.email}</div>
              <div className="advisor-phone">{advisor.phone || "N/A"}</div>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .advisor-carousel-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          background: none;
          backdrop-filter: none;
        }
        .advisor-carousel {
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          border-radius: 24px;
          border: none;
        }
        .advisor-carousel {
          transition: opacity ${CARD_FADE_DURATION}ms cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        .advisor-carousel.fade {
          opacity: 0;
        }
        .advisor-carousel.show {
          opacity: 1;
        }
        .college-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-align: center;
          color: #222;
          letter-spacing: 0.02em;
        }
        .advisor-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.2rem;
          justify-items: center;
        }
        .advisor-card {
          background: rgba(255,255,255,0.45);
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          padding: 1.2rem 1.5rem;
          width: 220px;
          height: 140px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          border: 1px solid rgba(255,255,255,0.25);
          box-sizing: border-box;
        }
        @media (max-width: 900px) {
          .advisor-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .advisor-cards {
            grid-template-columns: 1fr;
          }
          .advisor-card {
            width: 100%;
            height: auto;
          }
        }
        .advisor-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #333;
        }
        .advisor-email, .advisor-phone {
          font-size: 0.95rem;
          color: #444;
          margin-bottom: 0.2rem;
        }
      `}</style>
    </div>
  );
}
