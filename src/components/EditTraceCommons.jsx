import React, { Fragment, useCallback, useContext } from 'react';
import { Checkbox, Col, DatePicker, Form, Input, Row, Select, Typography } from 'antd';
import 'antd/dist/antd.css';
import PropTypes from 'prop-types';
import moment from 'moment';
import Web3 from 'web3';
import useReviewers from '../hooks/useReviewers';
import { getStartOfDayUTC, getHtmlText, ANY_TOKEN } from '../lib/helpers';
import Editor from './Editor';
import { Context as WhiteListContext } from '../contextProviders/WhiteListProvider';

const TraceTitle = ({ extra, onChange, value, disabled }) => (
  <Form.Item
    name="title"
    label="Title"
    className="custom-form-item"
    extra={extra}
    rules={[
      {
        required: true,
        type: 'string',
        min: 3,
        message: 'Please provide at least 3 characters',
      },
      {
        max: 100,
        message: 'Title cannot exceed 100 characters',
      },
      {
        pattern: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
        message: 'Title contains invalid characters',
      }
    ]}
    validateTrigger={['onChange', 'onBlur']}
  >
    <Input
      value={value}
      disabled={disabled}
      name="title"
      placeholder="e.g. Support continued Development"
      onChange={onChange}
      onBlur={(e) => {
        // Trim whitespace on blur
        if (e.target.value) {
          onChange({
            target: {
              name: 'title',
              value: e.target.value.trim()
            }
          });
        }
      }}
    />
  </Form.Item>
);

TraceTitle.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  extra: PropTypes.string,
  disabled: PropTypes.bool,
};

TraceTitle.defaultProps = {
  value: '',
  extra: '',
  disabled: false,
};

const TraceDescription = ({
  extra,
  onChange,
  placeholder,
  value,
  label,
  id,
  disabled,
  initialValue,
}) => {
  const onDescriptionChange = useCallback(
    description => {
      onChange({ target: { name: 'description', value: description } });
    },
    [onChange],
  );

  const validateDescription = (_, value) => {
    if (!value) {
      return Promise.reject('Description is required');
    }

    const textLength = getHtmlText(value).length;
    if (textLength < 10) {
      return Promise.reject('Description must be at least 10 characters');
    }
    if (textLength > 20000) {
      return Promise.reject('Description cannot exceed 20,000 characters');
    }

    // Check for basic HTML structure
    const hasValidHtml = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/.test(value);
    if (!hasValidHtml) {
      return Promise.reject('Please provide properly formatted content');
    }

    return Promise.resolve();
  };

  return (
    <Form.Item
      name={id}
      label={label}
      className="custom-form-item"
      extra={extra}
      required
      initialValue={initialValue}
      rules={[
        {
          required: true,
          message: 'Description is required',
        },
        {
          validator: validateDescription,
        }
      ]}
      validateTrigger={['onChange', 'onBlur']}
    >
      <Editor
        name="description"
        onChange={onDescriptionChange}
        value={value}
        placeholder={placeholder}
        id={id}
        key={id}
        disabled={disabled}
        initialValue={initialValue}
        aria-label="Trace description editor"
        role="textbox"
        aria-required="true"
      />
    </Form.Item>
  );
};

TraceDescription.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  extra: PropTypes.string,
  disabled: PropTypes.bool,
  initialValue: PropTypes.string,
};

TraceDescription.defaultProps = {
  value: '',
  placeholder: '',
  extra: '',
  disabled: false,
  initialValue: '',
};

const TraceDonateToCommunity = ({ onChange, value, disabled }) => (
  <Form.Item
    className="custom-form-item trace-donate-community"
    valuePropName="checked"
    extra={
      <div>
        Your help keeps Giveth alive.
        <span role="img" aria-label="heart">
          {' '}
          ❤️
        </span>
      </div>
    }
  >
    <Checkbox onChange={onChange} name="donateToCommunity" checked={value} disabled={disabled}>
      Donate 3% to Giveth
    </Checkbox>
  </Form.Item>
);

TraceDonateToCommunity.propTypes = {
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

TraceDonateToCommunity.defaultProps = {
  disabled: false,
};

const TraceReviewer = ({
  traceType,
  hasReviewer,
  traceReviewerAddress,
  setReviewer,
  initialValue,
  toggleHasReviewer,
  disabled,
}) => {
  const reviewers = useReviewers();
  return (
    <Fragment>
      <Form.Item className="custom-form-item trace-donate-community" valuePropName="checked">
        {toggleHasReviewer && (
          <Checkbox
            className="trace-reviewer-checkbox"
            name="hasReviewer"
            checked={hasReviewer}
            onChange={toggleHasReviewer}
            disabled={disabled}
          >
            {traceType} reviewer
          </Checkbox>
        )}
      </Form.Item>
      {hasReviewer && (
        <Fragment>
          <Form.Item
            name="Reviewer Address"
            initialValue={initialValue}
            rules={[{ required: true }]}
            extra={`The reviewer verifies that the ${traceType} is completed successfully.`}
          >
            <Select
              showSearch
              placeholder="Select a reviewer"
              optionFilterProp="children"
              name="reviewerAddress"
              onSelect={setReviewer}
              disabled={disabled}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              value={traceReviewerAddress}
            >
              {reviewers.map(({ name, address }) => (
                <Select.Option
                  key={address}
                  value={address}
                >{`${name} - ${address}`}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Fragment>
      )}
    </Fragment>
  );
};

TraceReviewer.propTypes = {
  traceType: PropTypes.string,
  hasReviewer: PropTypes.bool.isRequired,
  toggleHasReviewer: PropTypes.func,
  setReviewer: PropTypes.func.isRequired,
  traceReviewerAddress: PropTypes.string,
  initialValue: PropTypes.string,
  disabled: PropTypes.bool,
};

TraceReviewer.defaultProps = {
  traceType: 'Milestone',
  traceReviewerAddress: '',
  toggleHasReviewer: null,
  initialValue: null,
  disabled: false,
};

const TraceDatePicker = ({ onChange, value, disabled }) => {
  const maxValue = getStartOfDayUTC().subtract(1, 'd');

  return (
    <Row gutter={16}>
      <Col className="gutter-row" span={10}>
        <Form.Item
          label="Date"
          className="custom-form-item"
          rules={[{ required: true, message: 'Date is required' }]}
        >
          <DatePicker
            value={value}
            disabledDate={current => {
              return current && current > moment().startOf('day');
            }}
            defaultValue={value || maxValue}
            onChange={(_, dateString) => onChange(getStartOfDayUTC(dateString))}
            disabled={disabled}
          />
        </Form.Item>
      </Col>
    </Row>
  );
};

TraceDatePicker.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)]),
  disabled: PropTypes.bool,
};

TraceDatePicker.defaultProps = {
  value: undefined,
  disabled: false,
};

const TraceCampaignInfo = ({ campaign }) => (
  <div className="campaign-info">
    <div className="lable">Campaign</div>
    <div className="content">{campaign && campaign.title}</div>
  </div>
);
TraceCampaignInfo.propTypes = {
  campaign: PropTypes.shape({
    title: PropTypes.string,
  }),
};
TraceCampaignInfo.defaultProps = {
  campaign: {},
};

const TraceToken = ({
  label,
  onChange,
  value,
  totalAmount,
  includeAnyToken,
  hideTotalAmount,
  initialValue,
  disabled,
}) => {
  const {
    state: { activeTokenWhitelist },
  } = useContext(WhiteListContext);

  const handleSelectToken = (_, { value: symbol }) => {
    onChange(
      symbol === ANY_TOKEN.symbol ? ANY_TOKEN : activeTokenWhitelist.find(t => t.symbol === symbol),
    );
  };

  return (
    <Row gutter={16} align="middle">
      <Col className="gutter-row" span={14}>
        <Form.Item
          name="Token"
          label={label}
          className="custom-form-item mb-2"
          extra="Select the token you want to be reimbursed in."
          rules={[{ required: true, message: 'Payment currency is required' }]}
          initialValue={initialValue.symbol}
        >
          <Select
            showSearch
            placeholder="Select a Currency"
            optionFilterProp="children"
            name="token"
            onSelect={handleSelectToken}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            value={value && value.symbol}
            required
            disabled={disabled}
          >
            {includeAnyToken && (
              <Select.Option key={ANY_TOKEN.name} value={ANY_TOKEN.symbol}>
                Any Token
              </Select.Option>
            )}
            {activeTokenWhitelist.map(token => (
              <Select.Option key={token.name} value={token.symbol}>
                {token.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      {!hideTotalAmount && (
        <Col className="gutter-row" span={10}>
          <Typography.Text className="ant-form-text" type="secondary">
            ≈ {totalAmount}
          </Typography.Text>
        </Col>
      )}
    </Row>
  );
};

TraceToken.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.shape({
    symbol: PropTypes.string,
    name: PropTypes.string,
  }),
  totalAmount: PropTypes.string,
  includeAnyToken: PropTypes.bool,
  hideTotalAmount: PropTypes.bool,
  initialValue: PropTypes.shape({
    symbol: PropTypes.string,
  }),
  disabled: PropTypes.bool,
};

TraceToken.defaultProps = {
  value: {},
  totalAmount: '0',
  includeAnyToken: false,
  hideTotalAmount: false,
  initialValue: {
    symbol: null,
  },
  disabled: false,
};

const TraceRecipientAddress = ({ label, onChange, value, disabled }) => {
  const validateAddress = async (_, inputValue) => {
    if (!inputValue) {
      return Promise.reject('Recipient address is required');
    }
    
    if (!Web3.utils.isAddress(inputValue)) {
      return Promise.reject('Please enter a valid Ethereum address');
    }

    if (inputValue === '0x0000000000000000000000000000000000000000') {
      return Promise.reject('Cannot use zero address');
    }

    // Check if address is a contract
    try {
      const code = await web3.eth.getCode(inputValue);
      if (code !== '0x') {
        return Promise.reject('Cannot send to a contract address');
      }
    } catch (error) {
      return Promise.reject('Error validating address');
    }

    return Promise.resolve();
  };

  return (
    <Form.Item
      name="recipientAddress"
      label={label}
      className="custom-form-item"
      extra="If you don't change this field the address associated with your account will be used."
      rules={[
        {
          required: true,
          message: 'Recipient address is required',
        },
        {
          validator: validateAddress,
        }
      ]}
      validateTrigger={['onChange', 'onBlur']}
    >
      <Input
        value={value}
        name="recipientAddress"
        placeholder="0x"
        onChange={onChange}
        disabled={disabled}
        aria-label="Recipient ethereum address"
        autoComplete="off"
        maxLength={42}
      />
    </Form.Item>
  );
};

TraceRecipientAddress.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  disabled: PropTypes.bool,
};

TraceRecipientAddress.defaultProps = {
  value: '',
  disabled: false,
};

const TraceFiatAmountCurrency = ({
  onAmountChange,
  onCurrencyChange,
  amount,
  currency,
  id,
  disabled,
  initialValues,
}) => {
  const {
    state: { fiatWhitelist },
  } = useContext(WhiteListContext);

  return (
    <Row gutter={16}>
      <Col className="gutter-row" span={10}>
        <Form.Item
          name={`amount-${id}`}
          label="Amount"
          className="custom-form-item"
          extra="The amount should be the same as on the receipt."
          rules={[
            { required: true, message: 'Amount is required' },
            {
              pattern: /^\d*\.?\d*$/,
              message: 'Amount should contain just number',
            },
            {
              validator: async (_, val) => {
                if (val && Number.isNaN(val) === false && val <= 0) {
                  throw new Error('Amount should be greater than zero');
                }
              },
            },
          ]}
          initialValue={initialValues.fiatAmount}
        >
          <Input
            name="fiatAmount"
            value={amount}
            placeholder="Enter Amount"
            onChange={onAmountChange}
            autoComplete="off"
            disabled={disabled}
          />
        </Form.Item>
      </Col>
      <Col className="gutter-row" span={10}>
        <Form.Item
          name={`currency-${id}`}
          label="Currency"
          className="custom-form-item"
          extra="Select the currency of this expense."
          rules={[{ required: true, message: 'Amount currency is required' }]}
          initialValue={initialValues.selectedFiatType}
        >
          <Select
            showSearch
            placeholder="Select a Currency"
            optionFilterProp="children"
            name="currency"
            onSelect={onCurrencyChange}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            value={currency}
            required
            disabled={disabled}
          >
            {fiatWhitelist.map(cur => (
              <Select.Option key={cur} value={cur}>
                {cur}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
  );
};

TraceFiatAmountCurrency.propTypes = {
  onAmountChange: PropTypes.func.isRequired,
  onCurrencyChange: PropTypes.func.isRequired,
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currency: PropTypes.string,
  id: PropTypes.string,
  disabled: PropTypes.bool,
  initialValues: PropTypes.shape({
    selectedFiatType: PropTypes.string,
    fiatAmount: PropTypes.number,
  }),
};
TraceFiatAmountCurrency.defaultProps = {
  amount: 0,
  currency: '',
  id: '',
  disabled: false,
  initialValues: {
    selectedFiatType: null,
    fiatAmount: 0,
  },
};

// eslint-disable-next-line import/prefer-default-export
export {
  TraceTitle,
  TraceDescription,
  TraceDonateToCommunity,
  TraceReviewer,
  TraceDatePicker,
  TraceCampaignInfo,
  TraceToken,
  TraceRecipientAddress,
  TraceFiatAmountCurrency,
};
