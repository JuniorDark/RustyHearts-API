-- ----------------------------
-- procedure structure for CreateAccount
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[CreateAccount]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[CreateAccount]
GO

CREATE PROCEDURE [dbo].[CreateAccount]
@WindyCode varchar(50),
@AccountPwd varchar(255),
@Email varchar(255),
@RegisterIP varchar(16),
@ServerId int,
@ShopBalance Bigint
AS
BEGIN
    SET NOCOUNT ON;
		
		DECLARE @Result varchar(20)
		DECLARE @EmailExists int;
		DECLARE @UsernameExists int;
		DECLARE @WindyCodeExists int;
		
		BEGIN TRY
		BEGIN TRANSACTION


		SELECT @EmailExists = COUNT(*) FROM AccountTable
		WHERE Email = @Email;
		SELECT @UsernameExists = COUNT(*) FROM AccountTable
		WHERE WindyCode = @WindyCode;
		SELECT @WindyCodeExists = COUNT(*) FROM RustyHearts_Auth.dbo.AuthTable
		WHERE WindyCode = @WindyCode;


-- Check if account exists
        IF @EmailExists > 0
        SET @Result = 'EmailExists';
		ELSE IF @UsernameExists > 0
        SET @Result = 'UsernameExists';
		ELSE IF @WindyCodeExists > 0
        SET @Result = 'UsernameExists';
        ELSE 
        SET @Result = 'NewUser';

    -- Create new account
    IF @Result = 'NewUser' 
    BEGIN
        INSERT INTO AccountTable (WindyCode, AccountPwd, Email, RegisterIP, CreatedAt, LastLogin, IsLocked, LoginAttempts, LastLoginIP)
    VALUES (@WindyCode, @AccountPwd, @Email, @RegisterIP, GETDATE(), GETDATE(), 0, 0, @RegisterIP);
		
		INSERT INTO RustyHearts_Auth.dbo.AuthTable (WindyCode, world_id, AuthID, Tcount, online, CTime, BTime, LTime, IP, LCount, ServerIP, ServerType, HostID, DBCIndex, InquiryCount, event_inquiry, CashMileage, channelling, pc_room_point, externcash, mac_addr, mac_addr02, mac_addr03, second_pass) 
    VALUES (@WindyCode, 0, NEWID(), 0, '0', GETDATE(), GETDATE(), GETDATE(), @RegisterIP, 0, 0, 0, 0, 0, 5, 1, 0, 1, 0, 0, '00-00-00-00-00-00', '00-00-00-00-00-00', '00-00-00-00-00-00', '');
		
		INSERT INTO CashTable (WindyCode, WorldId, Zen)
    VALUES (@WindyCode, @ServerId, @ShopBalance);
		
		
		SET @Result = 'AccountCreated';

END;

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
ROLLBACK TRANSACTION;
SET @Result = 'TransactionFailed';
END CATCH

SELECT @Result as Result;

END
GO


-- ----------------------------
-- procedure structure for SetAccountVerificationCode
-- ----------------------------
IF EXISTS (SELECT * FROM sys.all_objects WHERE object_id = OBJECT_ID(N'[dbo].[SetAccountVerificationCode]') AND type IN ('P', 'PC', 'RF', 'X'))
	DROP PROCEDURE[dbo].[SetAccountVerificationCode]
GO

CREATE PROCEDURE [dbo].[SetAccountVerificationCode]
    @VerificationCode varchar(10),
    @Email varchar(255),
		@ExpirationTime DATETIME
AS
BEGIN
    SET NOCOUNT ON;
		
		DECLARE @Result varchar(20)
    DECLARE @AccountExists int;
		DECLARE @VerificationCodeCount int;
		
		BEGIN TRY
		BEGIN TRANSACTION

    SELECT @AccountExists = COUNT(*) FROM AccountTable
    WHERE Email = @Email;


-- Check if account exists
IF @AccountExists > 0
BEGIN
    SET @Result = 'AccountExists';
    COMMIT TRANSACTION;
    SELECT @Result as Result;
    RETURN;
END

    IF @Result = 'AccountDontExists' 
     -- Retrieve count of existing verification codes for the user
        SELECT @VerificationCodeCount = COUNT(*) FROM VerificationCode
        WHERE Email = @Email;

        -- Check if count of existing verification codes is less than 5
        IF @VerificationCodeCount < 5
        BEGIN
            -- Insert new verification code
            INSERT INTO VerificationCode (VerificationCode, Email, ExpirationTime, Type)
            VALUES (@VerificationCode, @Email, @ExpirationTime, 'Account');
            SET @Result = 'Success';
        END
        ELSE
        BEGIN
            -- Delete all existing verification codes for the user
            DELETE FROM VerificationCode WHERE Email = @Email;

            -- Insert new verification code
            INSERT INTO VerificationCode (VerificationCode, Email, ExpirationTime, Type)
            VALUES (@VerificationCode, @Email, @ExpirationTime, 'Account');
            SET @Result = 'Success';
        END;

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
ROLLBACK TRANSACTION;
SET @Result = 'TransactionFailed';
END CATCH

SELECT @Result as Result;

END
GO