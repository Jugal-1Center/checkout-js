import React, { FunctionComponent, memo } from 'react';

const InfoSection: FunctionComponent = () => {
    return (
      <section className="info-section-container">
        <p className="info-section-heading">Questions about shipping</p>
        <a
          href="/shipping-faq"
          title="Click here for processing and transit times"
          className="info-section-link"
        >
          Click here for processing and transit times
        </a>
        <p className="info-section-footer">
            Still need help? Call us at <a href="tel:8773352556">877-335-2556</a>
        </p>
      </section>
    );
}

export default memo(InfoSection);