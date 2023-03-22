import React, { Component, ReactNode } from 'react';
import { withLanguage, WithLanguageProps } from '../locale';

import { ShippingOptions } from '../shipping/shippingOption';
import { Form } from '../ui/form';
import { TranslatedString } from '../locale';
import CheckoutStepHeader from '../checkout/CheckoutStepHeader';
import CheckoutStepType from '../checkout/CheckoutStepType';

export interface CheckoutStepProps {
  isActive?: boolean;
  isComplete?: boolean;
  type: CheckoutStepType;
}

interface ShippingProps {
  loadShippingOptions?: void;
}

class CustomShippingSection extends Component<CheckoutStepProps, WithLanguageProps, ShippingProps> {
  render(): ReactNode {
    const {
      isActive,
      isComplete,
      type,
    } = this.props;

    return (
      <div className="custom-functions-container">
        {/* Custom: Shipping methods selection section */}
        <div className="checkout-view-header">
          <CheckoutStepHeader
            heading={<TranslatedString id="shipping.shipping_method_label" />}
            isActive={isActive}
            isComplete={isComplete}
            isEditable={false}
            summary=""
            type={type}
          />
        </div>

        <Form autoComplete="on" className="custom-shipping-steps">
          <ShippingOptions
            isMultiShippingMode={false}
            isUpdatingAddress={false}
            shouldShowShippingOptions={true}
          />
        </Form>

        {/* Custom: Shipping info section */}
      </div>
    );
  }
}

export default withLanguage(CustomShippingSection);
