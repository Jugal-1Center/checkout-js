import {
    Address,
    CheckoutRequestBody,
    CheckoutSelectors,
    Country,
    Customer,
    FormField,
} from '@bigcommerce/checkout-sdk';
import { noop } from 'lodash';
import React, { Component, ReactNode } from 'react';

import { AddressFormSkeleton } from '@bigcommerce/checkout/ui';

import { isEqualAddress, mapAddressFromFormValues } from '../address';
import { CheckoutContextProps, withCheckout } from '../checkout';
import { EMPTY_ARRAY, isFloatingLabelEnabled } from '../common/utility';
import { TranslatedString } from '../locale';
import { getShippableItemsCount } from '../shipping';
import { Legend } from '../ui/form';

import BillingForm, { BillingFormValues } from './BillingForm';
import getBillingMethodId from './getBillingMethodId';

export interface BillingProps {
    navigateNextStep(): void;
    onReady?(): void;
    onUnhandledError(error: Error): void;
    isBillingSameAsShipping?: boolean;
}

export interface WithCheckoutBillingProps {
    countries: Country[];
    countriesWithAutocomplete: string[];
    customer: Customer;
    customerMessage: string;
    googleMapsApiKey: string;
    isInitializing: boolean;
    isUpdating: boolean;
    shouldShowOrderComments: boolean;
    billingAddress?: Address;
    methodId?: string;
    useFloatingLabel?: boolean;
    getFields(countryCode?: string): FormField[];
    initialize(): Promise<CheckoutSelectors>;
    updateAddress(address: Partial<Address>): Promise<CheckoutSelectors>;
    updateCheckout(payload: CheckoutRequestBody): Promise<CheckoutSelectors>;
}

class Billing extends Component<BillingProps & WithCheckoutBillingProps> {
    constructor(props: any) {
        super(props);

        const {
            updateAddress,
            billingAddress,
            customer,
            navigateNextStep,
            isBillingSameAsShipping,
        } = props;

        /**
         * Update the billing address is the checkbox for isBillingSameAsShipping is checked,
         * the billing address is empty and, atleast one address exists in the customer list.
         **/ 
        if (isBillingSameAsShipping && billingAddress?.address1?.trim() === '' && customer?.addresses[0]) {
            /**
             * Calling an asynchronus anonymous function to make sure that
             * the response is awaited before the execution of next process.
             */
            (async () => {
                await updateAddress(customer.addresses[0]);
                navigateNextStep();
            })();
        }
    }
    async componentDidMount(): Promise<void> {
        const {
          initialize,
          onReady = noop,
          onUnhandledError,
        } = this.props;

        try {
            await initialize();
            onReady();
        } catch (error) {
            if (error instanceof Error) {
                onUnhandledError(error);
            }
        }

    }

    render(): ReactNode {
        const { updateAddress, isInitializing, ...props } = this.props;

        return (
            <AddressFormSkeleton isLoading={isInitializing}>
                <div className="checkout-form">
                    <div className="form-legend-container">
                        <Legend testId="billing-address-heading">
                            <TranslatedString id="billing.billing_address_heading" />
                        </Legend>
                    </div>
                    <BillingForm
                        {...props}
                        onSubmit={this.handleSubmit}
                        updateAddress={updateAddress}
                    />
                </div>
            </AddressFormSkeleton>
        );
    }

    private handleSubmit: (values: BillingFormValues) => void = async ({
        orderComment,
        ...addressValues
    }) => {
        const {
            updateAddress,
            updateCheckout,
            customerMessage,
            billingAddress,
            navigateNextStep,
            onUnhandledError,
        } = this.props;

        const promises: Array<Promise<CheckoutSelectors>> = [];
        const address = mapAddressFromFormValues(addressValues);

        if (address && !isEqualAddress(address, billingAddress)) {
            promises.push(updateAddress(address));
        }

        if (customerMessage !== orderComment) {
            promises.push(updateCheckout({ customerMessage: orderComment }));
        }

        try {
            await Promise.all(promises);

            navigateNextStep();
        } catch (error) {
            if (error instanceof Error) {
                onUnhandledError(error);
            }
        }
    };
}

function mapToBillingProps({
    checkoutService,
    checkoutState,
}: CheckoutContextProps): WithCheckoutBillingProps | null {
    const {
        data: {
            getCheckout,
            getConfig,
            getCart,
            getCustomer,
            getBillingAddress,
            getBillingAddressFields,
            getBillingCountries,
        },
        statuses: { isLoadingBillingCountries, isUpdatingBillingAddress, isUpdatingCheckout },
    } = checkoutState;

    const config = getConfig();
    const customer = getCustomer();
    const checkout = getCheckout();
    const cart = getCart();

    if (!config || !customer || !checkout || !cart) {
        return null;
    }

    const { enableOrderComments, googleMapsApiKey, features } = config.checkoutSettings;

    const countriesWithAutocomplete = ['US', 'CA', 'AU', 'NZ'];

    if (features['CHECKOUT-4183.checkout_google_address_autocomplete_uk']) {
        countriesWithAutocomplete.push('GB');
    }

    return {
        billingAddress: getBillingAddress(),
        countries: getBillingCountries() || EMPTY_ARRAY,
        countriesWithAutocomplete,
        customer,
        customerMessage: checkout.customerMessage,
        getFields: getBillingAddressFields,
        googleMapsApiKey,
        initialize: checkoutService.loadBillingAddressFields,
        isInitializing: isLoadingBillingCountries(),
        isUpdating: isUpdatingBillingAddress() || isUpdatingCheckout(),
        methodId: getBillingMethodId(checkout),
        shouldShowOrderComments: enableOrderComments && getShippableItemsCount(cart) < 1,
        updateAddress: checkoutService.updateBillingAddress,
        updateCheckout: checkoutService.updateCheckout,
        useFloatingLabel: isFloatingLabelEnabled(config.checkoutSettings),
    };
}

export default withCheckout(mapToBillingProps)(Billing);
