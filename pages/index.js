// ABOUTME: Main landing page component converted from static HTML
// ABOUTME: Includes course information, pricing, and checkout functionality

import Head from "next/head";
import Script from "next/script";
import { useEffect, useState, useRef } from "react";
import StripeCheckout from "../components/StripeCheckout";
import { logger } from '../lib/logger';

export default function Home() {
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    // Initialize Facebook tracking functions
    window.redirectWithTracking = function (url) {
      // Get Facebook browser parameters
      const fbp = getCookie("_fbp");
      const fbc = getCookie("_fbc");

      // Get fbclid from current URL if it exists
      const currentUrl = new URLSearchParams(window.location.search);
      const fbclid = currentUrl.get("fbclid");

      // Build URL with parameters
      let trackingUrl = url;
      const params = new URLSearchParams();

      if (fbp) params.append("fbp", fbp);
      if (fbc) params.append("fbc", fbc);
      if (fbclid) params.append("fbclid", fbclid);

      // Add timestamp for cache busting
      params.append("t", Date.now());

      if (params.toString()) {
        trackingUrl += (url.includes("?") ? "&" : "?") + params.toString();
      }

      // Track event before redirect
      if (typeof fbq !== "undefined") {
        fbq("track", "ViewContent", {
          content_name: "Checkout Page Click",
          value: 47.0,
          currency: "USD",
        });
      }

      // Redirect after small delay to ensure event fires
      setTimeout(() => {
        window.location.href = trackingUrl;
      }, 100);
    };

    // Helper function to get cookies
    window.getCookie = function (name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    };

    // FAQ accordion functionality
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      const arrow = item.querySelector(".arrow");

      question.addEventListener("click", () => {
        const isOpen = answer.classList.contains("open");

        // Close all other items
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.querySelector(".faq-answer").classList.remove("open");
            otherItem.querySelector(".arrow").classList.remove("rotated");
          }
        });

        // Toggle current item
        answer.classList.toggle("open");
        arrow.classList.toggle("rotated");
      });
    });

    // Read More/Less functionality
    const readMoreBtn = document.querySelector(".read-more-btn");
    const readMoreContent = document.querySelector(".read-more-content");
    const readMoreNote = document.querySelector(".read-more-note");
    const readLessBtn = document.querySelector(".read-less-btn");

    if (readMoreBtn) {
      readMoreBtn.addEventListener("click", function () {
        readMoreContent.classList.toggle("hidden");
        readMoreNote.classList.add("hidden");
        readMoreBtn.textContent = readMoreContent.classList.contains("hidden")
          ? "Read More"
          : "Read Less";
      });
    }

    if (readLessBtn) {
      readLessBtn.addEventListener("click", function () {
        readMoreContent.classList.toggle("hidden");
        readMoreNote.classList.remove("hidden");
        readMoreBtn.textContent = readMoreContent.classList.contains("hidden")
          ? "Read More"
          : "Read Less";
      });
    }

    // Initialize analytics tracking
    const initializeAnalytics = async () => {
      try {
        // Dynamically import the analytics tracker (client-side only)
        const { init } = await import('../lib/analytics-tracker');
        await init();
      } catch (error) {
        logger.devWarn('Analytics initialization failed:', error.message);
      }
    };

    // Initialize analytics after a short delay to ensure page is ready
    setTimeout(initializeAnalytics, 100);
  }, []);

  const handleRegisterClick = async () => {
    logger.dev('🎯 CTA Button clicked - opening payment form');
    
    // Track payment form opening with our analytics
    try {
      const { trackEvent } = await import('../lib/analytics-tracker');
      await trackEvent('click', {
        element: 'cta-payment-form',
        element_text: 'Start Course - $47',
        action: 'payment_form_open',
        value: 47
      });
      logger.dev('✅ Payment form open tracked');
    } catch (error) {
      logger.devWarn('❌ Failed to track payment form open:', error.message);
    }

    // Track checkout initiation with Facebook
    if (typeof fbq !== "undefined") {
      fbq("track", "InitiateCheckout", {
        content_name: "The Art of AI Sampling Course",
        value: 47.0,
        currency: "USD",
      });
    }

    setShowCheckout(true);
  };

  return (
    <>
      <Head>
        <title>The Art of AI Sampling with TÂCHES</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '924341239600510');
              fbq('track', 'PageView');
            `,
          }}
        />

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=924341239600510&ev=PageView&noscript=1"
          />
        </noscript>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Cutive+Mono&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <header className="header">
        {/* Logo section removed */}
        <div className="header__content hero-main-content">
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(1.2rem, 2.2vw, 1.5rem)",
              fontWeight: "600",
              marginBottom: "1.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#000000",
            }}
          >
            TÂCHES PRESENTS:
          </p>
          <h1
            style={{
              fontFamily: "'Poppins', sans-serif",
              marginTop: "0",
              fontSize: "clamp(3.5rem, 7.5vw, 5.5rem)",
              marginBottom: "2rem",
              lineHeight: "0.9",
              fontWeight: "600",
              textTransform: "uppercase",
              color: "#000000",
            }}
          >
            THE ART OF A.I. SAMPLING
          </h1>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(1.3rem, 2.6vw, 1.7rem)",
              fontWeight: "600",
              textTransform: "uppercase",
              marginTop: "0",
              marginBottom: "1.5rem",
              color: "#000000",
              maxWidth: "700px",
              marginInline: "auto",
              lineHeight: "1",
            }}
          >
            Learn how to use AI to expand your creative possibilities -{" "}
            <span style={{ textDecoration: "underline" }}>
              not replace them
            </span>
            .
          </p>
          <hr
            style={{
              border: "none",
              borderTop: "1px solid rgba(0, 0, 0, 0.1)",
              marginBlock: "1.5rem",
              width: "50%",
              marginInline: "auto",
            }}
          />
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "clamp(1rem, 2vw, 1.3rem)",
              fontWeight: "400",
              marginTop: "0",
              marginBottom: "2.5rem",
              color: "#000000",
              maxWidth: "700px",
              marginInline: "auto",
              lineHeight: "1",
            }}
          >
            A practical course for experienced
            <br className="br-mobile-only" /> producers
            <br className="br-desktop-only" />
            who want to push their boundaries.
          </p>

          <button
            className="hero-cta"
            onClick={handleRegisterClick}
            style={{
              fontFamily: "'Poppins', sans-serif",
              padding: "1.2rem 3rem",
              fontSize: "clamp(1.15rem, 2.5vw, 1.35rem)",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.075em",
              backgroundColor: "#e6ac55",
              color: "#000000",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow:
                "0 4px 15px rgba(230, 172, 85, 0.2), 0 2px 5px rgba(230, 172, 85, 0.15)",
            }}
          >
            START LEARNING →
          </button>
        </div>
      </header>

      <main>
        <section id="howdy" className="section">
          <div className="container">
            <div className="howdy-content">
              <div className="howdy-gif-container">
                <img
                  src="images/taches.gif"
                  alt="TÂCHES in studio"
                  className="howdy-gif"
                />
              </div>

              <p className="intro-text">
                <span className="drop-cap">H</span>owdy, I&apos;m TÂCHES and
                over the last 13 years, I&apos;ve built a 71M+ stream music
                career telling stories with &quot;samples&quot;. I&apos;ve
                chopped, repitched, reversed, resampled, repurposed and
                recombined many thousands of hours of audio in a myriad of weird
                and wonderful ways and have (at the time of writing this)
                officially released 124 songs. I&apos;ve released music on
                labels like Anjunadeep, Get Physical, and Desert Hearts, been
                featured in Vogue, Mixmag, and Billboard, and played headline
                slots at major festivals and clubs around the world. I would
                argue that I owe a significant portion of my success to the
                wonders of <b>sampling.</b>
              </p>

              <p className="read-more-note">
                I <u>hate</u> icky, never-ending sales pages and want to respect
                your time.
                <br />
                If you&apos;d like to learn more about my personal approach to
                sampling and how it intersects with AI music, click the button
                below. Otherwise, just scroll down for the essential course
                info.
              </p>

              <div className="read-more-btn-container">
                <button className="read-more-btn">Read More</button>
              </div>

              <div className="read-more-content hidden">
                <p>
                  While much of my music has been made by combining iPhone
                  recordings from my world travels with impomptu recordings of
                  myself or a dear friend pouring our hearts into an instrument,
                  a big passion of mine (and thus key component of my creative
                  process) has been digging for obscure, rare music to sample.
                  Whether it&apos;s by rooting through bins in dusty record
                  stores or scouring YouTube for zero-view videos of live
                  performances, something has always excited me about sampling.
                </p>
                <div className="howdy-image-container">
                  <img
                    src="images/audi.png"
                    alt="Audio waveform"
                    className="howdy-image"
                  />
                </div>
                <p>
                  <span className="drop-cap">T</span>o me, sampling is about
                  more than just sound - it&apos;s about imbuing your track with
                  traces of the feelings, memories, and stories that get
                  immortalized in a piece of &quot;complete&quot; music from
                  another time and place. When you sample a funk record from
                  1970s Tehran, you&apos;re not just sampling a drum beat or a
                  bass-line. You&apos;re sampling the story behind the song and
                  not just the sounds themselves. This adds a certain{" "}
                  <i>je-ne-sais-quoi</i> to a track that is difficult, if not
                  impossible, to capture by simply playing in the individual
                  parts today.
                </p>
                <p>
                  Since its invention decades go, sampling has been one of the
                  best ways to inject history, culture and texture into music
                  but it&apos;s been severely limited by two inconvenient
                  truths:
                </p>
                1. We can only sample what already exists.
                <br />
                2. We&apos;re at the mercy of what we can even find.
                <br />
                <div className="howdy-image-container">
                  <img
                    src="images/samplefind.png"
                    alt="Sample finding illustration"
                    className="howdy-image"
                  />
                </div>
                <h2>UNTIL A.I. CAME ALONG.</h2>
                <p>
                  <span className="drop-cap">I</span>n early 2023, I discovered
                  technology that allowed me to <i>generate</i> samples based
                  off of descriptions - in natural language - of the kinds of
                  genres, feelings, and textures I would hunt for in samples. I
                  could craft prompts that combined different musical
                  traditions, eras, and emotional qualities, I could explore
                  sonic territories that had never existed before. These tools
                  became a gateway to discovering entirely new musical
                  possibilities. The limitation of only being able to sample
                  what existed was suddenly lifted. A new frontier of creative
                  possibility had opened up.
                </p>
                <p>
                  Since then I&apos;ve been excitedly exploring how AI can
                  enhance my creative process; not as a shortcut or a
                  replacement for my artistic expression, but as a way to push
                  the boundaries of what I&apos;d known to be possible through
                  sampling. I&apos;ve developed an innovative - but incredibly
                  intuitive - approach that combines AI&apos;s rapidly evolving
                  capabilities with the timeless soul of what makes sampling{" "}
                  <i>human</i> music (lol) so special.
                </p>
                <p>
                  My approach isn&apos;t about pushing buttons and getting
                  instant tracks and it&apos;s definitely not about making AI
                  &quot;do the work for me&quot;. It&apos;s about fusing the
                  mind-boggling power of AI with the timeless magic of sampling
                  in a way that prioritizes authentic, human expression to
                  create beautiful music that moves people.
                </p>
                <p>
                  <b>
                    Now I want to help other forward-thinking producers discover
                    this exciting new frontier of creative possibility.
                    I&apos;ve distilled everything I&apos;ve learned into a
                    comprehensive course that cuts straight to what matters; no
                    fluff, just the essential techniques and approaches that
                    will help you use AI to create something truly unique
                    without losing your soul.
                  </b>
                </p>
                <div className="read-less-btn-container">
                  <button className="read-less-btn">Read Less</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="event" className="section">
          <div className="event-header">
            <h2>THE ART OF A.I. SAMPLING</h2>
            <p className="event-description">
              In this 6.5 hour course you&apos;ll learn how I combine cutting
              edge AI tools with advanced music production techniques to make
              high quality, emotionally resonant music. I&apos;ll be sharing my
              innovative approach to using AI as an extension of (and not a
              replacement for) your creativity to make music that feels
              authentically you.
            </p>
          </div>

          <div className="cards-container">
            <div className="card">
              <h3>DEFINE</h3>
              <p>
                Learn how to get crystal clear about your artistic vision and
                translate it into language that AI can understand. We&apos;ll
                explore:
              </p>
              <ul>
                <li>
                  How to identify and articulate the specific emotions,
                  textures, and musical elements that make up your unique sound
                </li>
                <li>
                  Creating custom templates and frameworks that align with your
                  artistic vision
                </li>
                <li>
                  Developing a precise musical vocabulary that helps you
                  consistently generate the kinds of sounds you want to work
                  with
                </li>
              </ul>
            </div>

            <div className="card">
              <h3>GENERATE</h3>
              <p>
                Master the technical side of AI music tools to generate unique
                samples that fit your individual artistic vision. We&apos;ll
                explore:
              </p>
              <ul>
                <li>
                  How to achieve precise control over your generations through
                  intentional prompt engineering and advanced A.I. functionality
                </li>
                <li>
                  Using features like Extend and Remix to tweak generated
                  content to your exact creative needs
                </li>
                <li>
                  Prompt formatting to create realistic, specific (and
                  emotional) vocal and instrumental performances
                </li>
              </ul>
            </div>

            <div className="card">
              <h3>REFINE</h3>
              <p>
                Transform and combine raw AI-generated samples into actual music
                with advanced production techniques. We&apos;ll explore:
              </p>
              <ul>
                <li>
                  Professional techniques for cleaning up and enhancing
                  AI-generated audio, including fixing spectral artifacts and
                  improving sound quality
                </li>
                <li>
                  Advanced production methods for blending AI samples with other
                  elements to create rich, layered arrangements
                </li>
                <li>
                  Transforming rough AI outputs into polished tracks that stand
                  up against any professional release
                </li>
              </ul>
            </div>
          </div>
          <div className="register-button-container">
            <button className="register-btn" onClick={handleRegisterClick}>
              GET THE COURSE
            </button>
          </div>
        </section>

        <section id="point" className="section">
          <div className="container">
            <h2>OK. BUT WHAT&apos;S THE POINT?</h2>

            <p>
              <span className="drop-cap">T</span>he point is that it&apos;s{" "}
              <span className="rainbow-text">fun</span>. I am by no means
              suggesting we replace traditional music production with AI.
              I&apos;m just excited to show you how you can use AI to expand
              your creative possibilities and speed up the ideation process.
              Think of it like having an infinitely large record collection that
              you can sample from, but one where you can describe the feelings
              or sounds you&apos;re looking for. The real magic happens when you
              combine AI-generated elements with traditional production
              techniques, treating AI outputs as raw ingredients to be shaped,
              processed, and transformed.
            </p>

            <p>This approach is particularly powerful for producers who:</p>
            <ul className="point-list">
              <li>
                Love working with samples but want more control over the process
                of finding their source material
              </li>
              <li>
                Want to quickly explore musical combinations that would be
                difficult (or impossible) to create traditionally
              </li>
              <li>
                Have a clear artistic vision but sometimes struggle to find the
                exact sounds they hear in their head
              </li>
              <li>
                Enjoy being surprised and inspired by unexpected - at times
                random - elements in their creative process
              </li>
            </ul>

            <p className="point-key">
              I cannot reiterate enough:{" "}
              <b>
                this is not about pushing a button and getting a finished track.
              </b>{" "}
              It&apos;s about having another powerful tool in your creative
              arsenal that can generate unique starting points for your
              productions so that you can explore and discover and have some
              fucking fun. The real work still lies in your ability to curate,
              process, and arrange these elements into something meaningful and
              emotionally resonant.{" "}
              <u>
                You need to be a skilled producer to get the most out of these
                tools
              </u>
              , but when used thoughtfully, they can open up entirely new
              creative possibilities.
            </p>
          </div>
        </section>

        <section id="pricing" className="section">
          <div className="container">
            <div className="pricing-box">
              <h2>JOIN THE COURSE</h2>
              <div className="pricing-content">
                <div className="price-tag">
                  <div className="price">
                    <span className="currency">$</span>
                    <span className="amount">47</span>
                  </div>
                </div>
                <div className="price-features">
                  <h3>What&apos;s Included:</h3>
                  <ul>
                    <li>
                      6.5-Hour Course
                      <ul>
                        <li>
                          Vision Development - Translating musical ideas into
                          effective AI prompts
                        </li>
                        <li>
                          Advanced UDIO Techniques - Moving beyond basic
                          generation
                        </li>
                        <li>
                          Stem Separation and Processing - Extracting and
                          refining elements
                        </li>
                        <li>
                          Production Integration - Incorporating AI into your
                          workflow
                        </li>
                        <li>
                          Sound Design and Repair - Professional enhancement
                          techniques
                        </li>
                      </ul>
                    </li>
                    <li>Lifetime Access to Course Materials</li>
                  </ul>
                </div>
                <div className="bonus-features">
                  <h4>You&apos;ll also receive:</h4>
                  <ul>
                    <li>
                      My &quot;UDIO Prompt Engineering Cheat Sheet&quot; PDF
                    </li>
                    <li>Access to my Custom Random Tag Generator App</li>
                    <li>My Custom Stem Splitting Software</li>
                    <li>All Of My Personal Custom Prompt Templates</li>
                  </ul>
                </div>
                <button className="enroll-btn" onClick={handleRegisterClick}>
                  ENROLL NOW
                </button>
                <p className="guarantee">30-Day Money-Back Guarantee</p>
              </div>
            </div>
          </div>
        </section>

        <section id="quality" className="section">
          <div className="quality-content">
            <h2>A NOTE ABOUT AI MUSIC QUALITY</h2>

            <div className="quality-lists">
              <div className="quality-list-container">
                <p>
                  I&apos;ll be real with you: AI-generated audio isn&apos;t
                  pristine. You&apos;ll often encounter issues like:
                </p>
                <ul className="quality-list challenges">
                  <li>
                    Spectral smearing and missing frequencies in separated stems
                  </li>
                  <li>Artifacts, clicks and pops in generated audio</li>
                  <li>Inconsistent quality in longer generations</li>
                  <li>Limited control over specific musical elements</li>
                </ul>
              </div>

              <div className="quality-list-container">
                <p>
                  This is why production skills are crucial. I&apos;ll show you
                  how to:
                </p>
                <ul className="quality-list solutions">
                  <li>Identify usable elements in messy generations</li>
                  <li>Clean up and enhance AI-generated audio</li>
                  <li>Layer and process stems effectively</li>
                  <li>Combine AI content with traditional production</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="section">
          <div className="faq-content">
            <h2>FAQ</h2>
            <div className="faq-item">
              <div className="faq-question">
                <span>How is this different from other AI music courses?</span>
                <b className="arrow rotatable">&gt;</b>
              </div>
              <div className="faq-answer">
                <p>
                  Every other course will teach basic AI tool usage with the
                  promise of &apos;push-button&apos; music creation - this is
                  not that kind of course. There are no shortcuts or magic
                  solutions here. This course is built on 15 years of production
                  experience and deep AI research, designed for serious
                  producers who want to expand their creative possibilities.
                  You&apos;ll learn sophisticated techniques for transforming
                  AI-generated content into professional, emotionally resonant
                  music while maintaining artistic integrity. This is about
                  enhancing your existing production skills with AI, not
                  replacing them.
                </p>
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <span>What exactly will I learn in this course?</span>
                <b className="arrow rotatable">&gt;</b>
              </div>
              <div className="faq-answer">
                <p>
                  You&apos;ll learn advanced prompt engineering, effective stem
                  separation techniques, methods for enhancing AI-generated
                  audio quality, creative sampling approaches, and my intuitive
                  workflow integration. The emphasis is on transforming
                  AI-generated content into polished, professional productions
                  through intentional processing and creative manipulation -
                  <b>not just &quot;generating music with AI&quot;</b>. This is
                  not a basic music production course - it&apos;s designed to
                  enhance the workflow of already experienced producers who
                  enjoy the process of sampling.
                </p>
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <span>Do I need advanced production experience?</span>
                <b className="arrow rotatable">&gt;</b>
              </div>
              <div className="faq-answer">
                <p>
                  Yes - this is absolutely essential. This is not a
                  beginner&apos;s course or a &apos;quick fix&apos; solution for
                  making music. You must already be comfortable with your DAW
                  and have experience producing complete tracks. Required
                  prerequisites include: mastery of basic music theory
                  (understanding key signatures, chord progressions, and song
                  structure), proficiency with audio processing fundamentals,
                  and experience with arrangement and mixing. The course assumes
                  you already know how to make music and focuses specifically on
                  integrating AI tools into an advanced production workflow. If
                  you&apos;re new to music production, this course is not
                  suitable for you. You should first learn traditional
                  production techniques before exploring my AI integration.
                </p>
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <span>What tools and software will I need?</span>
                <b className="arrow rotatable">&gt;</b>
              </div>
              <div className="faq-answer">
                <p>
                  The core techniques use UDIO.com ($10/month) and ChatGPT along
                  with your preferred DAW. I&apos;ll also be showcasing some of
                  the specialized tools and plugins that I use in my productions
                  but they aren&apos;t strictly required.
                </p>
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-question">
                <span>What&apos;s your refund policy?</span>
                <b className="arrow rotatable">&gt;</b>
              </div>
              <div className="faq-answer">
                <p>
                  I am highly confident that you&apos;ll be both satisfied with
                  and inspired by what I have to share. In the rare event that
                  you aren&apos;t, I offer a 30-day money-back guarantee. If
                  you&apos;re not completely happy with your purchase, I&apos;ll
                  give you a full refund with no questions asked.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Load script.js for typing animation */}
      <Script src="/script.js" strategy="lazyOnload" />

      {/* Stripe Checkout Modal */}
      <StripeCheckout
        isVisible={showCheckout}
        onClose={() => setShowCheckout(false)}
      />
    </>
  );
}
