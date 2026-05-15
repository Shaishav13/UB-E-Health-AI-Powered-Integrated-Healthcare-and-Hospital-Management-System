import React, { useState } from "react";
import { Modal } from "antd";
import { FaHeart, FaUsers, FaStar, FaBookMedical, FaShieldAlt, FaFileContract, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import LogoImg from "../img/logo2.png";


const Footer = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [healthResourcesOpen, setHealthResourcesOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <>
      <footer className="ub-footer">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section brand-section">
            <div className="footer-logo">
              <img 
    src={LogoImg} 
    alt="UB E-Health Logo" 
    style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
  />
              <span className="logo-text">UB E-Health</span>
            </div>
            <p className="footer-tagline">
              Your trusted partner in digital healthcare management
            </p>
            <div className="footer-contact">
              <div className="contact-item">
                <FaMapMarkerAlt />
                <span>UBHospital, 123, ABC</span>
              </div>
              <div className="contact-item">
                <FaPhone />
                <span>+91 1234567890</span>
              </div>
              <div className="contact-item">
                <FaEnvelope />
                <span>support@ubhealth.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Company</h3>
            <ul className="footer-links">
              <li onClick={() => setAboutOpen(true)}>
                <FaHeart className="link-icon" />
                <span>About Us</span>
              </li>
              <li onClick={() => setCommunityOpen(true)}>
                <FaUsers className="link-icon" />
                <span>Community</span>
              </li>
              <li onClick={() => setReviewsOpen(true)}>
                <FaStar className="link-icon" />
                <span>Reviews</span>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h3 className="footer-title">Resources</h3>
            <ul className="footer-links">
              <li onClick={() => setHealthResourcesOpen(true)}>
                <FaBookMedical className="link-icon" />
                <span>Health Resources</span>
              </li>
              <li>
                <FaBookMedical className="link-icon" />
                <span>FAQs</span>
              </li>
              <li>
                <FaBookMedical className="link-icon" />
                <span>Help Center</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-section">
            <h3 className="footer-title">Legal</h3>
            <ul className="footer-links">
              <li onClick={() => setPrivacyOpen(true)}>
                <FaShieldAlt className="link-icon" />
                <span>Privacy Policy</span>
              </li>
              <li onClick={() => setTermsOpen(true)}>
                <FaFileContract className="link-icon" />
                <span>Terms & Conditions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p><span>Udta Birdie Inc.</span>&copy; {new Date().getFullYear()} UB E-Health. All rights reserved.</p>

        </div>
      </footer>

      {/* About Modal */}
      <Modal
        title={<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0b6b61', display: 'flex', alignItems: 'center', gap: '10px' }}><FaHeart /> About UB E-Health</div>}
        open={aboutOpen}
        onCancel={() => setAboutOpen(false)}
        footer={null}
        width={700}
      >
        <div style={{ padding: '1rem 0' }}>
          <h3 style={{ color: '#0b6b61', marginBottom: '1rem' }}>Our Mission</h3>
          <p style={{ lineHeight: '1.8', color: '#374151', marginBottom: '1.5rem' }}>
            UB E-Health is committed to revolutionizing healthcare delivery through innovative digital solutions. 
            We provide a comprehensive platform that connects patients, doctors, and healthcare providers, 
            making quality healthcare accessible to everyone.
          </p>
          
          <h3 style={{ color: '#0b6b61', marginBottom: '1rem' }}>What We Offer</h3>
          <ul style={{ lineHeight: '2', color: '#374151', paddingLeft: '1.5rem' }}>
            <li>🏥 Easy appointment booking with qualified doctors</li>
            <li>💊 Digital prescription management</li>
            <li>🧪 Lab test booking with home collection</li>
            <li>📊 Health analytics and trend tracking</li>
            <li>🤖 AI-powered health assistance</li>
            <li>📱 24/7 accessible healthcare services</li>
          </ul>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>Our Values</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            We believe in patient-centric care, data security, innovation, and accessibility. 
            Our platform is designed with the highest standards of medical ethics and data protection.
          </p>
        </div>
      </Modal>

      {/* Community Modal */}
      <Modal
        title={<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0b6b61', display: 'flex', alignItems: 'center', gap: '10px' }}><FaUsers /> Our Community</div>}
        open={communityOpen}
        onCancel={() => setCommunityOpen(false)}
        footer={null}
        width={700}
      >
        <div style={{ padding: '1rem 0' }}>
          <h3 style={{ color: '#0b6b61', marginBottom: '1rem' }}>Join Our Healthcare Community</h3>
          <p style={{ lineHeight: '1.8', color: '#374151', marginBottom: '1.5rem' }}>
            UB E-Health brings together patients, doctors, and healthcare professionals in a collaborative ecosystem 
            focused on improving health outcomes and sharing knowledge.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(11, 107, 97, 0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2.5rem', color: '#0b6b61', marginBottom: '0.5rem' }}>1000+</div>
              <div style={{ color: '#64748b', fontWeight: '600' }}>Active Patients</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(11, 107, 97, 0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2.5rem', color: '#0b6b61', marginBottom: '0.5rem' }}>50+</div>
              <div style={{ color: '#64748b', fontWeight: '600' }}>Qualified Doctors</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(11, 107, 97, 0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '2.5rem', color: '#0b6b61', marginBottom: '0.5rem' }}>5000+</div>
              <div style={{ color: '#64748b', fontWeight: '600' }}>Appointments</div>
            </div>
          </div>

          <h3 style={{ color: '#0b6b61', marginTop: '2rem', marginBottom: '1rem' }}>Community Benefits</h3>
          <ul style={{ lineHeight: '2', color: '#374151', paddingLeft: '1.5rem' }}>
            <li>Connect with healthcare professionals</li>
            <li>Share health experiences and tips</li>
            <li>Access health education resources</li>
            <li>Participate in wellness programs</li>
            <li>Get support from fellow patients</li>
          </ul>
        </div>
      </Modal>

      {/* Reviews Modal */}
      <Modal
        title={<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0b6b61', display: 'flex', alignItems: 'center', gap: '10px' }}><FaStar /> Patient Reviews</div>}
        open={reviewsOpen}
        onCancel={() => setReviewsOpen(false)}
        footer={null}
        width={700}
      >
        <div style={{ padding: '1rem 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', color: '#0b6b61', fontWeight: '700' }}>4.8/5</div>
            <div style={{ color: '#f59e0b', fontSize: '1.5rem', marginBottom: '0.5rem' }}>★★★★★</div>
            <div style={{ color: '#64748b' }}>Based on 500+ reviews</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', background: '#f9fafb', borderRadius: '12px', borderLeft: '4px solid #0b6b61' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#1e293b' }}>Priya Sharma</strong>
                <span style={{ color: '#f59e0b' }}>★★★★★</span>
              </div>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                "Excellent platform! Booking appointments is so easy and the doctors are very professional. 
                The AI health assistant is a great feature."
              </p>
            </div>

            <div style={{ padding: '1.5rem', background: '#f9fafb', borderRadius: '12px', borderLeft: '4px solid #0b6b61' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#1e293b' }}>Rajesh Kumar</strong>
                <span style={{ color: '#f59e0b' }}>★★★★★</span>
              </div>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                "The lab test home collection service is fantastic. Very convenient and the reports are 
                delivered quickly with AI-powered insights."
              </p>
            </div>

            <div style={{ padding: '1.5rem', background: '#f9fafb', borderRadius: '12px', borderLeft: '4px solid #0b6b61' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ color: '#1e293b' }}>Dr. Anjali Mehta</strong>
                <span style={{ color: '#f59e0b' }}>★★★★★</span>
              </div>
              <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                "As a doctor, this platform makes patient management so much easier. The digital prescription 
                system and report generation are excellent features."
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Health Resources Modal */}
      <Modal
        title={<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0b6b61', display: 'flex', alignItems: 'center', gap: '10px' }}><FaBookMedical /> Health Resources</div>}
        open={healthResourcesOpen}
        onCancel={() => setHealthResourcesOpen(false)}
        footer={null}
        width={700}
      >
        <div style={{ padding: '1rem 0' }}>
          <p style={{ lineHeight: '1.8', color: '#374151', marginBottom: '2rem' }}>
            Access comprehensive health information and educational resources to make informed decisions about your health.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1.5rem', background: 'rgba(11, 107, 97, 0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s' }}>
              <h4 style={{ color: '#0b6b61', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📚 Health Articles
              </h4>
              <p style={{ color: '#64748b', margin: 0 }}>
                Read expert-written articles on various health topics, diseases, and wellness tips.
              </p>
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(11, 107, 97, 0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s' }}>
              <h4 style={{ color: '#0b6b61', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🎥 Video Library
              </h4>
              <p style={{ color: '#64748b', margin: 0 }}>
                Watch educational videos on health conditions, treatments, and preventive care.
              </p>
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(11, 107, 97, 0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s' }}>
              <h4 style={{ color: '#0b6b61', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💪 Wellness Programs
              </h4>
              <p style={{ color: '#64748b', margin: 0 }}>
                Join our wellness programs for fitness, nutrition, mental health, and chronic disease management.
              </p>
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(11, 107, 97, 0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s' }}>
              <h4 style={{ color: '#0b6b61', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🤖 AI Health Assistant
              </h4>
              <p style={{ color: '#64748b', margin: 0 }}>
                Get instant answers to your health questions from our AI-powered chatbot available 24/7.
              </p>
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(11, 107, 97, 0.05)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s' }}>
              <h4 style={{ color: '#0b6b61', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📊 Health Calculators
              </h4>
              <p style={{ color: '#64748b', margin: 0 }}>
                Use our BMI calculator, calorie counter, and other health assessment tools.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        title={<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0b6b61', display: 'flex', alignItems: 'center', gap: '10px' }}><FaShieldAlt /> Privacy Policy</div>}
        open={privacyOpen}
        onCancel={() => setPrivacyOpen(false)}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div style={{ padding: '1rem 0' }}>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>1. Information We Collect</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            We collect information that you provide directly to us, including:
          </p>
          <ul style={{ lineHeight: '2', color: '#374151', paddingLeft: '1.5rem' }}>
            <li>Personal information (name, email, phone number, date of birth)</li>
            <li>Medical information (health records, prescriptions, lab reports)</li>
            <li>Payment information (for appointment and lab test bookings)</li>
            <li>Usage data (how you interact with our platform)</li>
          </ul>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>2. How We Use Your Information</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            We use the information we collect to:
          </p>
          <ul style={{ lineHeight: '2', color: '#374151', paddingLeft: '1.5rem' }}>
            <li>Provide, maintain, and improve our services</li>
            <li>Process appointments and lab test bookings</li>
            <li>Send you notifications and updates</li>
            <li>Provide customer support</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>3. Data Security</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            We implement industry-standard security measures to protect your personal and medical information. 
            All data is encrypted in transit and at rest. We comply with HIPAA and other relevant healthcare 
            data protection regulations.
          </p>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>4. Information Sharing</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            We do not sell your personal information. We may share your information with:
          </p>
          <ul style={{ lineHeight: '2', color: '#374151', paddingLeft: '1.5rem' }}>
            <li>Healthcare providers (doctors, labs) for treatment purposes</li>
            <li>Service providers who assist in platform operations</li>
            <li>Legal authorities when required by law</li>
          </ul>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>5. Your Rights</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            You have the right to:
          </p>
          <ul style={{ lineHeight: '2', color: '#374151', paddingLeft: '1.5rem' }}>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Download your medical records</li>
          </ul>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>6. Cookies and Tracking</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            We use cookies and similar technologies to improve your experience, analyze usage patterns, 
            and personalize content. You can control cookie preferences through your browser settings.
          </p>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>7. Contact Us</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            If you have questions about this Privacy Policy, please contact us at:
            <br />
            Email: privacy@ubhealth.com
            <br />
            Phone: +91 1234567890
          </p>
        </div>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal
        title={<div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0b6b61', display: 'flex', alignItems: 'center', gap: '10px' }}><FaFileContract /> Terms & Conditions</div>}
        open={termsOpen}
        onCancel={() => setTermsOpen(false)}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div style={{ padding: '1rem 0' }}>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>1. Acceptance of Terms</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            By accessing and using UB E-Health platform, you accept and agree to be bound by these Terms and Conditions. 
            If you do not agree to these terms, please do not use our services.
          </p>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>2. User Accounts</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            You are responsible for:
          </p>
          <ul style={{ lineHeight: '2', color: '#374151', paddingLeft: '1.5rem' }}>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and complete information</li>
            <li>Updating your information when necessary</li>
          </ul>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>3. Medical Disclaimer</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            UB E-Health is a platform that facilitates healthcare services but does not provide medical advice. 
            The information provided through our platform is for informational purposes only and should not replace 
            professional medical consultation. Always seek the advice of qualified healthcare providers.
          </p>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>4. Appointment Booking</h3>
          <ul style={{ lineHeight: '2', color: '#374151', paddingLeft: '1.5rem' }}>
            <li>Appointments are subject to doctor availability</li>
            <li>Cancellations must be made at least 2 hours in advance</li>
            <li>No-shows may result in account restrictions</li>
            <li>Consultation fees are non-refundable unless cancelled by the doctor</li>
          </ul>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>5. Payment Terms</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            All payments are processed securely through our payment gateway. Fees for services are clearly 
            displayed before booking. Refunds are processed according to our refund policy.
          </p>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>6. Prohibited Activities</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            You agree not to:
          </p>
          <ul style={{ lineHeight: '2', color: '#374151', paddingLeft: '1.5rem' }}>
            <li>Use the platform for any illegal purposes</li>
            <li>Share false or misleading information</li>
            <li>Attempt to gain unauthorized access to the system</li>
            <li>Harass or abuse healthcare providers or other users</li>
            <li>Use automated systems to access the platform</li>
          </ul>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>7. Intellectual Property</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            All content, features, and functionality on UB E-Health are owned by us and protected by copyright, 
            trademark, and other intellectual property laws.
          </p>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>8. Limitation of Liability</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            UB E-Health shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
            resulting from your use of the platform or services.
          </p>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>9. Changes to Terms</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            We reserve the right to modify these terms at any time. Continued use of the platform after changes 
            constitutes acceptance of the modified terms.
          </p>

          <h3 style={{ color: '#0b6b61', marginTop: '1.5rem', marginBottom: '1rem' }}>10. Contact Information</h3>
          <p style={{ lineHeight: '1.8', color: '#374151' }}>
            For questions about these Terms & Conditions, contact us at:
            <br />
            Email: legal@ubhealth.com
            <br />
            Phone: +91 1234567890
          </p>
        </div>
      </Modal>

      <style>{`
        .ub-footer {
          background: linear-gradient(135deg, #0b6b61 0%, #13a189 100%);
          color: white;
          padding: 3rem 2rem 1rem;
          margin-top: auto;
        }

        .footer-content {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
          margin-bottom: 2rem;
        }

        @media (max-width: 1024px) {
          .footer-content {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }
        }

        @media (max-width: 640px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }

        .footer-section {
          display: flex;
          flex-direction: column;
        }

        .brand-section {
          padding-right: 2rem;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .logo-icon {
          font-size: 2rem;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .footer-tagline {
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .footer-contact {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
        }

        .contact-item svg {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .footer-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: white;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .footer-links li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0.5rem;
          border-radius: 6px;
        }

        .footer-links li:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(5px);
        }

        .link-icon {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .footer-bottom {
          max-width: 1400px;
          margin: 0 auto;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-bottom p {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .footer-credits {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 640px) {
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
};

export default Footer;
